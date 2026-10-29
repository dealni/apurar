/** Dados públicos preservados. Os JSONs são editáveis; imports estáticos mantêm a inicialização síncrona. */
import presidente from './candidates/presidente.json' with { type: 'json' };
import candidatosAC from './candidates/states/ac.json' with { type: 'json' };
import candidatosAL from './candidates/states/al.json' with { type: 'json' };
import candidatosAM from './candidates/states/am.json' with { type: 'json' };
import candidatosAP from './candidates/states/ap.json' with { type: 'json' };
import candidatosBA from './candidates/states/ba.json' with { type: 'json' };
import candidatosCE from './candidates/states/ce.json' with { type: 'json' };
import candidatosDF from './candidates/states/df.json' with { type: 'json' };
import candidatosES from './candidates/states/es.json' with { type: 'json' };
import candidatosGO from './candidates/states/go.json' with { type: 'json' };
import candidatosMA from './candidates/states/ma.json' with { type: 'json' };
import candidatosMG from './candidates/states/mg.json' with { type: 'json' };
import candidatosMS from './candidates/states/ms.json' with { type: 'json' };
import candidatosMT from './candidates/states/mt.json' with { type: 'json' };
import candidatosPA from './candidates/states/pa.json' with { type: 'json' };
import candidatosPB from './candidates/states/pb.json' with { type: 'json' };
import candidatosPE from './candidates/states/pe.json' with { type: 'json' };
import candidatosPI from './candidates/states/pi.json' with { type: 'json' };
import candidatosPR from './candidates/states/pr.json' with { type: 'json' };
import candidatosRJ from './candidates/states/rj.json' with { type: 'json' };
import candidatosRN from './candidates/states/rn.json' with { type: 'json' };
import candidatosRO from './candidates/states/ro.json' with { type: 'json' };
import candidatosRR from './candidates/states/rr.json' with { type: 'json' };
import candidatosRS from './candidates/states/rs.json' with { type: 'json' };
import candidatosSC from './candidates/states/sc.json' with { type: 'json' };
import candidatosSE from './candidates/states/se.json' with { type: 'json' };
import candidatosSP from './candidates/states/sp.json' with { type: 'json' };
import candidatosTO from './candidates/states/to.json' with { type: 'json' };
import partidos from './candidates/partidos.json' with { type: 'json' };
import federacoes from './candidates/federacoes.json' with { type: 'json' };
import bandeiras from './candidates/bandeiras.json' with { type: 'json' };
import exterior from './candidates/exterior.json' with { type: 'json' };
import senado from './candidates/senado.json' with { type: 'json' };
import retratos from './candidates/retratos.json' with { type: 'json' };

window.CANDIDATOS = {
  presidente,
  governador: {
    AC: candidatosAC.governador,
    AL: candidatosAL.governador,
    AM: candidatosAM.governador,
    AP: candidatosAP.governador,
    BA: candidatosBA.governador,
    CE: candidatosCE.governador,
    DF: candidatosDF.governador,
    ES: candidatosES.governador,
    GO: candidatosGO.governador,
    MA: candidatosMA.governador,
    MG: candidatosMG.governador,
    MS: candidatosMS.governador,
    MT: candidatosMT.governador,
    PA: candidatosPA.governador,
    PB: candidatosPB.governador,
    PE: candidatosPE.governador,
    PI: candidatosPI.governador,
    PR: candidatosPR.governador,
    RJ: candidatosRJ.governador,
    RN: candidatosRN.governador,
    RO: candidatosRO.governador,
    RR: candidatosRR.governador,
    RS: candidatosRS.governador,
    SC: candidatosSC.governador,
    SE: candidatosSE.governador,
    SP: candidatosSP.governador,
    TO: candidatosTO.governador,
  },
  senador: {
    AC: candidatosAC.senador,
    AL: candidatosAL.senador,
    AM: candidatosAM.senador,
    AP: candidatosAP.senador,
    BA: candidatosBA.senador,
    CE: candidatosCE.senador,
    DF: candidatosDF.senador,
    ES: candidatosES.senador,
    GO: candidatosGO.senador,
    MA: candidatosMA.senador,
    MG: candidatosMG.senador,
    MS: candidatosMS.senador,
    MT: candidatosMT.senador,
    PA: candidatosPA.senador,
    PB: candidatosPB.senador,
    PE: candidatosPE.senador,
    PI: candidatosPI.senador,
    PR: candidatosPR.senador,
    RJ: candidatosRJ.senador,
    RN: candidatosRN.senador,
    RO: candidatosRO.senador,
    RR: candidatosRR.senador,
    RS: candidatosRS.senador,
    SC: candidatosSC.senador,
    SE: candidatosSE.senador,
    SP: candidatosSP.senador,
    TO: candidatosTO.senador,
  },
};
window.PARTIDOS = partidos;
window.FEDERACOES = federacoes;
window.BANDEIRAS = bandeiras;
window.EXTERIOR = exterior;
window.SENADO = senado;
window.RETRATOS = retratos;
