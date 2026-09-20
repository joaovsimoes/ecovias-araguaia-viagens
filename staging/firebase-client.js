/**
 * STAGING ONLY: not hosted from public/. No private service account credentials here.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyB-beRCpCHbglUifV7wHPvNpbjQQ-pgrSk',
  authDomain: 'ecovias-araguaia-viagens.firebaseapp.com',
  projectId: 'ecovias-araguaia-viagens',
  storageBucket: 'ecovias-araguaia-viagens.firebasestorage.app',
  messagingSenderId: '801756023315',
  appId: '1:801756023315:web:6152887882a4d6d760cde6',
  measurementId: 'G-MEH1G6MG8X'
};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const userReady=new Promise((resolve,reject)=>{
  const stop=onAuthStateChanged(auth,user=>{stop();resolve(user)},error=>{stop();reject(error)});
});
async function ensureIdentity(){
  await userReady;
  if(!auth.currentUser)await signInAnonymously(auth);
  return auth.currentUser;
}
function aliasFor(username){
  const normalized=String(username).trim().toLowerCase();
  if(!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(normalized))
    throw new Error('Usuário inválido. Use de 3 a 40 letras, números, pontos, hífens ou sublinhados.');
  // Internal Firebase Auth email alias. No real email mailbox and no email typed in UI.
  return normalized+'@ecovias-araguaia-viagens.invalid';
}
function summaryFor(entry) {
  return {
    codigo: entry.codigo,
    status: entry.status,
    retorno: String(entry.notaAdmin || ''),
    atualizadoEm: entry.atualizadoEm || entry.criadoEm || new Date().toISOString()
  };
}
window.firebasePortal={
  ready:ensureIdentity(),
  async adminLogin(username,password){
    await this.ready;
    const normalized=String(username).trim().toLowerCase();
    const credential=await signInWithEmailAndPassword(auth,aliasFor(username),password);
    const profile=await getDoc(doc(db,'admins',credential.user.uid));
    if(!profile.exists()||profile.data().active!==true||profile.data().role!=='admin'||profile.data().username!==normalized){
      await signOut(auth);await signInAnonymously(auth);
      throw new Error('Usuário sem permissão de administrador.');
    }
    return {username:normalized,uid:credential.user.uid};
  },
  async logoutAdmin(){await signOut(auth);await signInAnonymously(auth)},
  async createRequest(entry){
    const user=await ensureIdentity();
    const request={...entry,ownerUid:user.uid};
    const batch=writeBatch(db);
    batch.set(doc(db,'solicitacoes',entry.codigo),request);
    batch.set(doc(db,'andamentos',entry.codigo),summaryFor(request));
    await batch.commit();
    return entry.codigo;
  },
  async lookupPublicStatus(code){
    await ensureIdentity();
    const normalized=String(code).trim().toUpperCase();
    if(!/^VG-[0-9]{4}-[A-Z0-9]{5}$/.test(normalized))return null;
    const snap=await getDoc(doc(db,'andamentos',normalized));
    return snap.exists()?snap.data():null;
  },
  async listRequests(){
    await ensureIdentity();
    const snap=await getDocs(collection(db,'solicitacoes'));
    return snap.docs.map(item=>item.data()).sort((a,b)=>String(b.criadoEm||'').localeCompare(String(a.criadoEm||'')));
  },
  async updateRequest(code,item){
    await ensureIdentity();
    // Os dois documentos são gravados atomicamente; dados pessoais ficam na solicitação privada.
    const batch=writeBatch(db);
    batch.set(doc(db,'solicitacoes',code),{...item});
    batch.set(doc(db,'andamentos',code),summaryFor(item));
    await batch.commit();
  },
  async syncPublicStatuses(requests){
    await ensureIdentity();
    // Migra pedidos criados antes da consulta entre dispositivos.
    const summaries=await getDocs(collection(db,'andamentos'));
    const present=new Set(summaries.docs.map(item=>item.id));
    const pending=requests.filter(item=>!present.has(item.codigo));
    for(let i=0;i<pending.length;i+=400){
      const batch=writeBatch(db);
      for(const item of pending.slice(i,i+400)){
        batch.set(doc(db,'andamentos',item.codigo),summaryFor(item));
      }
      await batch.commit();
    }
    return pending.length;
  },
  async loadConfig(){
    await ensureIdentity();
    const snap=await getDoc(doc(db,'portalConfig','form'));
    return snap.exists()?snap.data():{baseConfigs:{},customFields:[]};
  },
  async saveConfig(settings){
    await ensureIdentity();
    await setDoc(doc(db,'portalConfig','form'),{
      baseConfigs:settings.baseConfigs||{},
      customFields:settings.customFields||[]
    });
  }
};
window.dispatchEvent(new Event('firebasePortalReady'));
