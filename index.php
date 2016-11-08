<?
$DOCUMENT_ROOT = '/var/www/project/dev/harviewer/webapp';
$SUB_DIR = '/hars';
if (!empty(__DIR__)) {
    $DOCUMENT_ROOT = __DIR__;
}

$arResult = array(
    'FILTER_DIR' => ''
);
if (is_dir($DOCUMENT_ROOT . $SUB_DIR)) {
    $arPaths = scandir($DOCUMENT_ROOT . $SUB_DIR);
    $arFiles = array();
    foreach ($arPaths as $key => $arPath) {
        if ($key > 1) {
            if (!is_dir($DOCUMENT_ROOT . $SUB_DIR . '/' . $arPath)) {
                $arFiles[] = $arPath;
                unset($arPaths[$key]);
            }
        } else {
            unset($arPaths[$key]);
        }
    }
    if (!empty($arPaths)) {
        $html = '<select class="Filter__folder js-checkFile"><option value="" selected="selected">Не выбрано</option>';
        foreach ($arPaths as $path) {
            $html .= '<option value="' . $SUB_DIR . '/'  . $path . '">' . $path . '</option>';
        }
        $html .= '</select>';
        $arResult['FILTER_DIR'] = $html;
    } elseif (!empty($arFiles)) {
        $html = '<select class="Filter__folder js-viewFile"><option value="" selected="selected">Не выбрано</option>';
        foreach ($arFiles as $path) {
            $html .= '<option value="' . $SUB_DIR . '/' . $path . '">' . $path . '</option>';
        }
        $html .= '</select>';
        $arResult['FILTER_DIR'] = $html;
    }
}

//сделать: добавление глобального таба с инпутами, выгрузка с использованием har.js
header("Content-Type: text/html; charset=utf-8");
?>
<!doctype html>
<html>
<head>
    <title>HTTP Archive Viewer - INT</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <link rel="stylesheet" href="css/harViewer.css" type="text/css">
</head>
<body class="js-ajaxListener">
    <div class="Wrapper">
        <div class="FilterWrapper">
            <? if (!empty($arResult['FILTER_DIR'])) { ?>
                <div class="Filter js-ajaxForm" data-tab-id="1">
                    <span class="Filter__label">Путь</span>
                    <?=$arResult['FILTER_DIR']?>
                </div>
            <? } ?>

        </div>
        <div class="Content">
            <? if (!empty($arResult['FILTER_DIR'])) { ?>
            <div class="Content__tab js-ajaxTabContent" data-tab-id="1"></div>
            <? } ?>
        </div>
    </div>
    <script src="scripts/jquery.js"></script>
    <script src="scripts/script.js"></script>
    <script data-main="scripts/harViewer" src="scripts/require.js"></script>
    <!--@GOOGLE-ANALYTICS-INCLUDE@-->
</body>
</html>
