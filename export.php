<?php
// export.php: Accepte des données CSV via POST et force le téléchargement du fichier
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['csv'])) {
    $csv = $_POST['csv'];
    $filename = 'export_offres_' . date('Ymd_His') . '.csv';
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');
    echo "\xEF\xBB\xBF"; // BOM UTF-8 pour Excel
    echo $csv;
    exit;
} else {
    http_response_code(400);
    echo 'Aucune donnée CSV reçue.';
    exit;
}
?><!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export CSV</title>
</head>
<body>
    <h2>Erreur : accès direct non autorisé</h2>
    <p>Utilisez l'export depuis l'outil principal.</p>
</body>
</html>
