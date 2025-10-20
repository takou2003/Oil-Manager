import express from 'express';
const router = express.Router();
import { db } from '../firebase.js';
import { Timestamp } from '../firebase.js';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('acceuil', { title: 'Express' });
});

/* GET login page. */

router.get('/logina', function(req, res, next) {
  res.render('log', { title: 'Express' });
});

/* GET specifiques group page. */

router.get('/groupes/:id', async function(req, res, next) {
  try {
    const stations = [];
    const id_group = req.params.id;
    
    // 1. Récupérer le groupe par son ID de document Firestore
    const groupeDocRef = db.collection('groupes').doc(id_group);
    const groupeDoc = await groupeDocRef.get();

    // Vérifier si le groupe existe
    if (!groupeDoc.exists) {
      return res.status(404).render('error', { 
        message: 'Groupe non trouvé',
        error: { status: 404 }
      });
    }

    const groupeData = groupeDoc.data();
    //const groupeId = groupeDoc.id_g; // 
    // 2. Récupérer les stations associées à ce groupe
   const stationsSnapshot = await db.collection('stations')
      .where('id_g', '==', groupeData.id_g) // 
      .get();

    stationsSnapshot.forEach(doc => {
      stations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // 3. Rendre la vue avec les données
   res.render('groups', { 
      title: 'Détails du groupe',
      gname: groupeData.name,
      stations: stations,
      gid: id_group,
      group_direct : id_group
    });
  } catch (error) {
    console.error('Erreur Firestore:', error);
    res.status(500).render('error', { 
      message: 'Erreur serveur',
      error: error 
    });
  }
});

/* Use post to update device*/

router.post('/update', async function(req, res, next){
	
	try{
		var infos = req.body;
		var timer = req.body.date;
		var device = [];
		//var update = [];
		var new_info = {};
		const date = new Date(timer.replace(' ', 'T'));
		
		if (isNaN(date.getTime())) {
		    throw new Error('Format de date invalide');
		}
		var new_time = Timestamp.fromDate(date);
		const deviceSnapshot = await db.collection('devices')
      		.where('id_d', '==', infos.id_d) 
      		.get();
		deviceSnapshot.forEach(doc =>{
			device.push({			
			id: doc.id,
			...doc.data(),			
		        });
		});
		new_info.id_d = device[0].id_d;
		new_info.id_s = device[0].id_s;
		new_info.last_update = new_time;
		new_info.name = device[0].name;
		new_info.volume = parseInt(infos.volume);
		new_info.volume_total = device[0].volume_total;
		//console.log(device[0].id);
		const docRef = db.collection('devices').doc(device[0].id);
    		await docRef.update(new_info);
    		res.status(200).json({ message: 'Device mis à jour avec succès' });
    						
	}catch(error){	
		console.error('Erreur Firestore:', error);

	}
});
/* Use post to save new report*/

router.post('/save_report', async function(req,res,next){
	try{
		var new_report = req.body;
		var timer = req.body.day;
		var new_objet ={};
		const date = new Date(timer.replace(' ', 'T'));
		if (isNaN(date.getTime())) {
		    throw new Error('Format de date invalide');
		}
		var new_time = Timestamp.fromDate(date);
		new_objet.adjust = parseInt(req.body.adjust);
		new_objet.close = parseInt(req.body.close);
		new_objet.day = new_time;
		new_objet.id_d = req.body.id_d;
		new_objet.open = parseInt(req.body.open);
		new_objet.stc_i = parseInt(req.body.stc_i);
		new_objet.stc_j = parseInt(req.body.stc_j);
		
		const docRef = await db.collection('reports').add({
	        ...new_objet
	        });
		console.log(`Document créé avec ID: ${docRef.id}`)
		console.log(new_objet);
		//console.log(new_report.date);
		res.send(docRef.id);
						
	}catch(error){
		console.error('Erreur Firestore:', error);
		res.send(error);

	}
});

/* GET specifiques station page. */
router.get('/groupes/:id/station/:st_id', async function(req, res, next) {
  try{
    const devices = [];
    const id_st = req.params.st_id;
    const id_group = req.params.id;
    
    // 1. Récupérer le groupe par son ID de document Firestore
    const stationDocRef = db.collection('stations').doc(id_st);
    const stationDoc = await stationDocRef.get();

    // Vérifier si le groupe existe
    if (!stationDoc.exists) {
      return res.status(404).render('error', { 
        message: 'station non trouvée',
        error: { status: 404 }
      });
    }

    const stationData = stationDoc.data();

    // 2. Récupérer les device associées à ce groupe
   const deviceSnapshot = await db.collection('devices')
      .where('id_s', '==', stationData.id_s) // 
      .get();

    deviceSnapshot.forEach(doc => {
    
      	  const data = doc.data();
	  let formattedDate = 'N/A';
	  let formattedTime = 'N/A';
	  //last_update
	  // Vérifier et formater le timestamp si présent
	  if (data.last_update && data.last_update._seconds) {
	    const date = new Date(data.last_update._seconds * 1000);
	    
	    // Formater la date (YYYY-MM-DD)
	    const year = date.getFullYear();
	    const month = String(date.getMonth() + 1).padStart(2, '0');
	    const day = String(date.getDate()).padStart(2, '0');
	    formattedDate = `${year}-${month}-${day}`;
	    
	    // Formater l'heure (HH:MM:SS)
	    const hours = String(date.getHours()).padStart(2, '0');
	    const minutes = String(date.getMinutes()).padStart(2, '0');
	    const seconds = String(date.getSeconds()).padStart(2, '0');
	    formattedTime = `${hours}:${minutes}:${seconds}`;
            }
  
      devices.push({
        id: doc.id,
        ...doc.data(),
        date: formattedDate,    // Ajout de l'attribut date formaté
        time: formattedTime     // Ajout de l'attribut time formaté
      });
    });
//console.log(devices);  
let date_collection = [];

for (const device of devices) {
    const snapshot = await db.collection('reports')
        .where('id_d', '==', device.id_d)
        .get();
    
    const moisAnnees = new Set();
    
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.day) {
            const date = data.day.toDate();
            const moisAnnee = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            moisAnnees.add(moisAnnee);
        }
    });
    
    const resultats = Array.from(moisAnnees).sort().reverse();
    
    date_collection.push(resultats);
}
    res.render('station', { 
      title: 'Détails du groupe',
      sname: stationData.name,
      devices: devices,
      group_direct : id_st,
      group_id : id_group,
      timing : date_collection
    });
  
  }catch (error){
    console.error('Erreur Firestore:', error);
    res.status(500).render('error', { 
      message: 'Erreur serveur',
      error: error 
    });
  }

});

/* GET specifiques station analyse page. */
router.get('/groupes/:id/station/:st_id/journal/:id_device/:date', async function(req, res, next) {

  try{
     
     const id_dev = req.params.id_device;
     const id_device = req.params.id_device;
     const id_station = req.params.st_id;
     const moment = req.params.date;
     const gid = req.params.id;
     
     const querySnapshot = await db.collection('devices').where('id_d', '==', id_dev).limit(1).get();
     const doc = querySnapshot.docs[0];
     const xe = doc.data();
     const device_name = xe.name;

     const stationDocRef = db.collection('stations').doc(id_station);
     const stationDoc = await stationDocRef.get();
     const stationData = stationDoc.data();
     const name_station = stationData.name;
     
     const [year, month] = moment.split('-').map(Number);
       var mois;
       switch(month){
       	case 1:
        mois="janvier";
        break;
        case 2:
        mois="Fevrier";
        break;
        case 3:
        mois="Mars";
        break;
        case 4:
        mois="Avril";
        break;
        case 5:
        mois="Mai";
        break;
        case 6:
        mois="Juin";
        break;
        case 7:
        mois="Juillet";
        break;
        case 8:
        mois="Aout";
        break;
        case 9:
        mois="Septembre";
        break;
        case 10:
        mois="Octobre";
        break;
        case 11:
        mois="Novembre";
        break;
        case 12:
        mois="Decembre";
        break;
       }
       var final_date = `${mois} ${year}`;
       const startDate = new Date(year, month - 1, 1);
       const endDate = new Date(year, month, 1);
       const snapshot = await db.collection('reports')
        .where('id_d', '==', id_dev)
        .get();
       const results = [];
       snapshot.forEach(doc => {
       const data = doc.data();
       if (data.day) {
       	const date = data.day.toDate();
      	if (date >= startDate && date < endDate) {
        const dateFormatee = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;     
        results.push({
          id: doc.id,
          date: dateFormatee,
          timestamp: data.day,
          ...data
        });
      }
    }
  });
   
    var adding = {  
    	index_o:0,
    	index_f:0, 
    	index_a:0
    };
    
    for(var i=0; i<results.length; i++){
    	
    	adding.index_o += results[i].open;
    	adding.index_f += results[i].close;
    	adding.index_a += results[i].adjust;
    	
    }
     //console.log(adding);
     var stock_initial = results[results.length - 1].stc_i;
     var diff = adding.index_f - adding.index_o;
     var stock_theorique = adding.index_a + stock_initial - diff;
     var stock_jauge = results[results.length - 1].stc_j;
     var ecart =  stock_theorique - stock_jauge;
      
    res.render('view_data', { 
    title: 'Express', 
    device_name: device_name,
    name_station: name_station,
    results:results,
    final_date:final_date,
    collect: adding,
    stock_initial:stock_initial,
    ecart:ecart,
    stock_theorique:stock_theorique,
    diff:diff,
    stock_jauge: stock_jauge,
    gid: gid

    });  
           
  }catch (error){
    console.error('Erreur Firestore:', error);
    res.status(500).render('error', { 
      message: 'Erreur serveur',
      error: error 
    });
  	
  }
  
});


/* POST authentification */
router.get('/login', async (req, res) => {
    const code_group = req.query.code;
    
    if (!code_group) {
        return res.status(400).json({ error: 'Le paramètre code est requis' });
    }

    try {
        // REQUÊTE OPTIMISÉE : Chercher directement le groupe par son code
        const snapshot = await db.collection('groupes')
            .where('code', '==', code_group)
            .limit(1)
            .get();

        if (snapshot.empty) {
            // Aucun groupe trouvé avec ce code
            return res.json({
                exist: false,
                key: null
            });
        }

        // Groupe trouvé
        const groupe = snapshot.docs[0];
        res.json({
            exist: true,
            key: groupe.id
        });

    } catch (error) {
        console.error('Erreur Firestore:', error);
        res.status(500).json({ 
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
});

export default router;
