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
// Campos explicitamente não pessoais. Não usar spread do pedido ou campos dinâmicos.
const TRAVEL_FIELDS=["origem","destino","dataIda","dataVolta","periodoIda","periodoVolta","classe","bagagem","cidade","hotelPreferido","checkin","checkout","regiao","retiradaLocal","devolucaoLocal","retiradaData","retiradaHora","devolucaoData","devolucaoHora","categoria","periodo"];
const TRAVEL_LABELS={"origem":"Origem","destino":"Destino","dataIda":"Data da ida","dataVolta":"Data da volta","periodoIda":"Período da ida","periodoVolta":"Período da volta","classe":"Classe ou passagem","bagagem":"Bagagem","cidade":"Cidade","hotelPreferido":"Hotel de preferência","checkin":"Check-in","checkout":"Check-out","regiao":"Região de referência","retiradaLocal":"Local de retirada","devolucaoLocal":"Local de devolução","retiradaData":"Data da retirada","retiradaHora":"Horário de retirada","devolucaoData":"Data da devolução","devolucaoHora":"Horário de devolução","categoria":"Categoria do veículo","periodo":"Horário preferido"};
function travelFor(entry){
  return Object.fromEntries(TRAVEL_FIELDS.map(key=>[key,String(entry[key]??'')]));
}
function summaryFor(entry,previous=null){
  const viagem=travelFor(entry);
  const changed=previous?.viagem
    ?TRAVEL_FIELDS.filter(key=>String(previous.viagem[key]??'')!==viagem[key]).map(key=>TRAVEL_LABELS[key])
    :[];
  const alteration=changed.length
    ?'Informações da viagem atualizadas: '+changed.join(', ')
    :previous?.status&&previous.status!==entry.status
      ?'Etapa atualizada para '+entry.status
      :'';
  return {
    codigo:entry.codigo,
    status:entry.status,
    retorno:String(entry.notaAdmin||''),
    atualizadoEm:entry.atualizadoEm||entry.criadoEm||new Date().toISOString(),
    servico:String(entry.tipo||''),
    viagem,
    alteracoes:alteration.slice(0,240)
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
    const previousSnapshot=await getDoc(doc(db,'andamentos',code));
    const previous=previousSnapshot.exists()?previousSnapshot.data():null;
    const batch=writeBatch(db);
    batch.set(doc(db,'solicitacoes',code),{...item});
    batch.set(doc(db,'andamentos',code),summaryFor(item,previous));
    await batch.commit();
  },
  async syncPublicStatuses(requests){
    await ensureIdentity();
    // Migra pedidos criados antes da consulta entre dispositivos.
    let phase='listar andamentos';
    try {
      const summaries=await getDocs(collection(db,'andamentos'));
      const byCode=new Map(summaries.docs.map(snap=>[snap.id,snap.data()]));
      const pending=requests.filter(item=>{
        const old=byCode.get(item.codigo);
        return !old || !old.viagem || old.servico!==item.tipo;
      });
      // Regras com getAfter/exists têm limite de leituras por lote.
      // Lotes pequenos evitam extrapolar o limite ao migrar pedidos antigos.
      for(let i=0;i<pending.length;i+=8){
        phase='gravar lote '+(Math.floor(i/8)+1);
        const batch=writeBatch(db);
        for(const item of pending.slice(i,i+8)){
          batch.set(doc(db,'andamentos',item.codigo),summaryFor(item));
        }
        await batch.commit();
      }
      return pending.length;
    } catch(error) {
      error.portalPhase=phase;
      throw error;
    }
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
