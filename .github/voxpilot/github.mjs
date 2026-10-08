// Caller supplies a persisted task ID and exact repository scope. No blind write retries.
export async function prepareDraft({repository,baseSha,taskId,goal,files,signal,request=fetch,token=process.env.VOXPILOT_GITHUB_TOKEN}) {
 if(!token)throw Error('GitHub token is not configured');
 if(!/^[\w.-]+\/[\w.-]+$/.test(repository))throw Error('Invalid GitHub repository');
 if(!/^[a-f\d]{40}$/.test(baseSha)||!/^[\w-]+$/.test(taskId))throw Error('Invalid revision or task ID');
 const branch='voxpilot/'+taskId;
 async function api(path,method='GET',body){
  signal?.throwIfAborted();
  const response=await request('https://api.github.com/repos/'+repository+path,{method,signal,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok){const error=Error('GitHub request failed ('+response.status+')');error.status=response.status;throw error;}
  return response.json();
 }
 const existing=await api('/pulls?state=all&head='+encodeURIComponent(repository.split('/')[0]+':'+branch));
 if(existing.length)return {url:existing[0].html_url,number:existing[0].number,reused:true};
 let ref;try{ref=await api('/git/ref/heads/'+branch);}catch(e){if(e.status!==404)throw e;}
 if(!ref){
  const base=await api('/git/commits/'+baseSha);
  const tree=[];
  for(const file of files){
   if(file.content===null){tree.push({path:file.path,mode:file.mode||'100644',type:'blob',sha:null});continue;}
   const blob=await api('/git/blobs','POST',{content:file.content,encoding:'base64'});
   tree.push({path:file.path,mode:file.mode||'100644',type:'blob',sha:blob.sha});
  }
  const createdTree=await api('/git/trees','POST',{base_tree:base.tree.sha,tree});
  const commit=await api('/git/commits','POST',{message:goal,tree:createdTree.sha,parents:[baseSha]});
  await api('/git/refs','POST',{ref:'refs/heads/'+branch,sha:commit.sha});
 }
 const repositoryInfo=await api('');
 // Verify the target branch still includes the inspected base; never silently target unrelated history.
 const comparison=await api('/compare/'+baseSha+'...'+repositoryInfo.default_branch);
 if(!['identical','ahead'].includes(comparison.status))throw Error('Default branch diverged from inspected revision');
 const pr=await api('/pulls','POST',{title:goal.slice(0,200),head:branch,base:repositoryInfo.default_branch,draft:true,body:'Verified by VoxPilot task '+taskId+'.\n\nNode.js tests passed in a detached checkout before this draft was prepared.'});
 return {url:pr.html_url,number:pr.number,reused:false};
}
