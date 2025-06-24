<?php
// export.php

if (isset($_POST['export_data'])) {
    $data = json_decode($_POST['export_data'], true);

    if (is_array($data) && !empty($data)) {
        // Définir les en-têtes pour forcer le téléchargement
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="comparatif_offres_'.date('Y-m-d').'.csv"');

        // Ouvrir le flux de sortie PHP
        $output = fopen('php://output', 'w');
        
        // Ajouter les en-têtes du CSV
        fputcsv($output, ['Nom de l\'offre', 'Cout Total (€)', 'Delai Intervention (h)', 'Score Materiel (/100)', 'Ressenti (/100)'], ';');

        // Parcourir les données et les écrire dans le CSV
        foreach ($data as $row) {
            fputcsv($output, $row, ';');
        }

        fclose($output);
        exit();
    }
}

// Rediriger ou afficher une erreur si les données sont absentes
header('Location: index.html'); // ou afficher un message d'erreur
exit();

?>