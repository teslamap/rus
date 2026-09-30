
(()=>{
const cfg=window.APP_CONFIG||{};
const ready=cfg.SUPABASE_URL&&
  !cfg.SUPABASE_URL.includes('YOUR-PROJECT')&&
  cfg.SUPABASE_ANON_KEY&&
  !cfg.SUPABASE_ANON_KEY.includes('YOUR_');

const $=id=>document.getElementById(id);
let client=null,signup=false,working=false,recovery=false;

function message(t){
  if($('authError')) $('authError').textContent=t||'';
}

function mode(){
  $('authSubmit').textContent=recovery
    ?'ახალი პაროლის შენახვა'
    :(signup?'ანგარიშის შექმნა':'შესვლა');

  $('authToggle').hidden=recovery;
  $('authReset').hidden=recovery;

  $('authToggle').textContent=signup
    ?'უკვე გაქვს ანგარიში? შესვლა'
    :'ანგარიში არ გაქვს? რეგისტრაცია';

  $('authIntro').textContent=recovery
    ?'შეიყვანე ახალი პაროლი.'
    :(signup
      ?'შექმენი ანგარიში და შეინახე პროგრესი.'
      :'შედი ანგარიშში ან შექმენი ახალი ანგარიში პროგრესის შესანახად.');

  $('authPassword').autocomplete=signup?'new-password':'current-password';
  message('');
}

function showAuth(){
  $('authScreen').hidden=false;
  $('appShell').hidden=true;
}

// Supabase-ის გარეშე სტუმრის რეჟიმი
function enterGuest(){
  window.currentAuthUser={
    id:'guest',
    email:'guest@local.test'
  };

  window.appStoreKey='ruska_arcade_v3:guest';
  window.persistCloud=null;
  window.initialCloud=null;

  $('authScreen').hidden=true;
  $('appShell').hidden=false;

  if($('userEmail')){
    $('userEmail').textContent='სტუმრის რეჟიმი';
  }

  window.dispatchEvent(new Event('app-auth-ready'));
}

async function enter(session){
  const user=session.user;

  $('authScreen').hidden=true;
  $('appShell').hidden=false;

  $('userEmail').textContent=user.email||'ანგარიში';

  window.appStoreKey='ruska_arcade_v3:'+user.id;
  window.currentAuthUser=user;

  window.persistCloud=async payload=>{
    try{
      const {error}=await client.from('user_progress').upsert({
        user_id:user.id,
        payload,
        updated_at:new Date().toISOString()
      },{onConflict:'user_id'});

      if(error)console.error('Cloud save failed',error.message);
    }catch(e){
      console.error(e);
    }
  };

  try{
    const {data,error}=await client.from('user_progress')
      .select('payload')
      .eq('user_id',user.id)
      .maybeSingle();

    if(!error&&data?.payload){
      window.initialCloud=data.payload;
    }else{
      window.initialCloud=null;
    }
  }catch(e){
    window.initialCloud=null;
  }

  window.dispatchEvent(new Event('app-auth-ready'));
}

async function init(){
  // თუ Supabase ჯერ არ არის კონფიგურირებული,
  // აპი იხსნება სტუმრის რეჟიმში.
  if(!ready||!window.supabase){
    enterGuest();
    return;
  }

  client=window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    {
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true
      }
    }
  );

  $('authForm').addEventListener('submit',async e=>{
    e.preventDefault();
    if(working)return;

    working=true;
    $('authSubmit').disabled=true;
    message('');

    const email=$('authEmail').value.trim();
    const password=$('authPassword').value;

    let result;

    try{
      if(recovery){
        result=await client.auth.updateUser({password});
      }else if(signup){
        result=await client.auth.signUp({email,password});
      }else{
        result=await client.auth.signInWithPassword({email,password});
      }
    }catch(err){
      working=false;
      $('authSubmit').disabled=false;
      message(err.message||'შეცდომა მოხდა.');
      return;
    }

    working=false;
    $('authSubmit').disabled=false;

    if(result.error){
      message(result.error.message);
      return;
    }

    if(recovery){
      recovery=false;
      signup=false;
      mode();
      message('პაროლი განახლდა. ახლა შედი ახალი პაროლით.');
      await client.auth.signOut();
      return;
    }

    if(signup&&!result.data.session){
      message('ანგარიში შეიქმნა. დაადასტურე ელფოსტა და შემდეგ შედი.');
      return;
    }

    if(result.data.session){
      await enter(result.data.session);
    }
  });

  $('authToggle').onclick=()=>{
    signup=!signup;
    recovery=false;
    mode();
  };

  $('authReset').onclick=async()=>{
    const email=$('authEmail').value.trim();

    if(!email){
      message('ჯერ ელფოსტა შეიყვანე.');
      return;
    }

    const {error}=await client.auth.resetPasswordForEmail(email,{
      redirectTo:location.origin+location.pathname
    });

    message(error
      ?error.message
      :'თუ ეს ელფოსტა რეგისტრირებულია, აღდგენის ინსტრუქცია გამოგეგზავნება.');
  };

  $('logoutBtn').onclick=async()=>{
    await client.auth.signOut();
    window.persistCloud=null;
    window.initialCloud=null;
    showAuth();
  };

  const {data}=await client.auth.getSession();

  if(data.session){
    await enter(data.session);
  }else{
    showAuth();
  }

  client.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){
      window.persistCloud=null;
      showAuth();
    }else if(event==='PASSWORD_RECOVERY'){
      recovery=true;
      signup=false;
      showAuth();
      mode();
      message('შეიყვანე ახალი პაროლი ანგარიშის აღსადგენად.');
    }
  });
}

document.addEventListener('DOMContentLoaded',init);
})();
