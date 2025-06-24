// js/ai.js
export const AIAnalyzer = (() => {
    let apiKey = localStorage.getItem('geminiApiKey_v1') || "";

    const calculerScores = (offresAComparer, DOMRefs, modelesDb) => {
        const volumeNb = parseInt(document.getElementById('sim-volume-nb').value);
        const volumeCouleur = parseInt(document.getElementById('sim-volume-couleur').value);
        const dureeSim = parseInt(document.getElementById('sim-duree').value);

        let resultats = offresAComparer.map(offre => {
            if (offre.isGroup) {
                const enfants = offre.children.map(id => DataManager.getOffreById(id)).filter(Boolean);
                if (enfants.length === 0) return null;
                let tcoGroupe = 0;
                enfants.forEach(enfant => {
                    const coutConsoMensuel = (volumeNb * enfant.coutNb) + (volumeCouleur * enfant.coutCouleur);
                    let tcoEnfant = (enfant.location + coutConsoMensuel) * dureeSim;
                    (enfant.coutsAdditionnels || []).forEach(cout => {
                        const montant = parseFloat(cout.montant) || 0;
                        if (cout.periodicite === 0) tcoEnfant += montant;
                        else if (cout.periodicite > 0) tcoEnfant += montant * Math.floor(dureeSim / cout.periodicite);
                    });
                    tcoGroupe += tcoEnfant;
                });
                return { ...offre, tco: tcoGroupe, gti_heures: enfants.reduce((acc, e) => acc + e.gti_heures, 0) / enfants.length, score_modele_moyen: enfants.reduce((acc, e) => acc + (modelesDb[e.modele]?.score_modele || 75), 0) / enfants.length };
            } else {
                const coutConsoMensuel = (volumeNb * offre.coutNb) + (volumeCouleur * offre.coutCouleur);
                let tco = (offre.location + coutConsoMensuel) * dureeSim;
                (offre.coutsAdditionnels || []).forEach(cout => {
                    const montant = parseFloat(cout.montant) || 0;
                    if (cout.periodicite === 0) tco += montant;
                    else if (cout.periodicite > 0) tco += montant * Math.floor(dureeSim / cout.periodicite);
                });
                return { ...offre, tco, score_modele_moyen: modelesDb[offre.modele]?.score_modele || 75 };
            }
        }).filter(Boolean);

        if (resultats.length > 1) {
            const minTco = Math.min(...resultats.map(r => r.tco));
            const maxTco = Math.max(...resultats.map(r => r.tco));
            const minGti = Math.min(...resultats.map(r => r.gti_heures));
            const maxGti = Math.max(...resultats.map(r => r.gti_heures));
            resultats.forEach(res => {
                res.score_cout = (maxTco === minTco) ? 100 : 100 * (maxTco - res.tco) / (maxTco - minTco);
                res.score_qualite = (maxGti === minGti) ? 100 : 100 * (maxGti - res.gti_heures) / (maxGti - minGti);
            });
        } else {
             resultats.forEach(res => { res.score_cout = 100; res.score_qualite = 100; });
        }
        const poids = {
            cout: DOMRefs.sliders.cout.value / 100,
            qualite: DOMRefs.sliders.qualite.value / 100,
            modele: DOMRefs.sliders.modele.value / 100,
            ressenti: DOMRefs.sliders.ressenti.value / 100,
        };
        resultats.forEach(res => {
            const ressentiApplicable = res.isGroup ? 50 : res.ressenti;
            res.score_final = (res.score_cout * poids.cout) + (res.score_qualite * poids.qualite) + (res.score_modele_moyen * poids.modele) + (ressentiApplicable * poids.ressenti);
        });
        resultats.sort((a, b) => b.score_final - a.score_final);
        return resultats;
    };
    
    const genererAnalyseAutomatique = (resultats, templates) => {
        if (resultats.length === 0) return "Aucune donnée à analyser.";
        const meilleureOffre = resultats[0];
        let analyse = templates.recommandation.replace('{prestataire}', `**${meilleureOffre.prestataire}**`).replace('{score_final}', `**${meilleureOffre.score_final.toFixed(1)}**`);
        const scores = { cout: meilleureOffre.score_cout, qualite: meilleureOffre.score_qualite, modele: meilleureOffre.score_modele_moyen };
        const pointFort = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        if (pointFort === 'cout') analyse += `\n${templates.point_fort_cout}`;
        if (pointFort === 'qualite') analyse += `\n${templates.point_fort_qualite.replace('{gti_heures}', meilleureOffre.gti_heures)}`;
        if (pointFort === 'modele') analyse += `\n${templates.point_fort_modele.replace('{modele}', `**${meilleureOffre.modele}**`)}`;
        if (resultats.length > 1) {
            const challenger = resultats[1];
            const scoresChallenger = { cout: challenger.score_cout, qualite: challenger.score_qualite, modele: challenger.score_modele_moyen };
            const pointFortChallengerKey = Object.keys(scoresChallenger).reduce((a, b) => scoresChallenger[a] > scoresChallenger[b] ? a : b);
            const pointFortChallengerText = {"cout": "son coût", "qualite": "son service", "modele": "son matériel"}[pointFortChallengerKey];
            analyse += `\n\n${templates.challenger.replace('{prestataire_challenger}', `**${challenger.prestataire}**`).replace('{point_fort_challenger}', pointFortChallengerText)}`;
        }
        analyse += `\n\n${templates.conclusion_generale.replace('{prestataire}', `**${meilleureOffre.prestataire}**`)}`;
        return analyse;
    };

    const appelerGeminiAPI = async (resultats) => {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const dataForPrompt = resultats.map(r => ({ prestataire: r.prestataire, score_final: r.score_final.toFixed(1), cout_total: r.tco.toFixed(2), qualite_service_gti: r.gti_heures, qualite_materiel: r.modele }));
        const prompt = `En tant qu'expert en achat et gestion de contrats d'entreprise, analyse les données suivantes qui comparent plusieurs offres de copieurs. Fournis une conclusion claire et professionnelle en français. Voici les données : ${JSON.stringify(dataForPrompt, null, 2)} Ton analyse doit inclure : 1. Une recommandation claire de la meilleure offre et pourquoi (basée sur le score final). 2. Une analyse des forces et faiblesses de l'offre recommandée. 3. Une comparaison rapide avec le principal challenger (la deuxième meilleure offre). 4. Une conclusion synthétique. Adopte un ton formel et direct. Ne renvoie que le texte de l'analyse, sans préambule. Utilise **mot** pour mettre en gras.`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) { const errorBody = await response.json(); console.error("Erreur API Gemini:", errorBody); return "Erreur lors de la communication avec l'API. Vérifiez votre clé et les permissions."; }
            const result = await response.json();
            return result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("Erreur Fetch:", error);
            return "Impossible de contacter le service d'analyse. Vérifiez votre connexion internet.";
        }
    };

    return {
        calculerScores,
        saveApiKey: (key) => { apiKey = key; localStorage.setItem('geminiApiKey_v1', key); },
        genererAnalyseTexte: async (resultats, templates) => {
            if (apiKey) { return await appelerGeminiAPI(resultats); } 
            else { return genererAnalyseAutomatique(resultats, templates); }
        }
    };
})();
