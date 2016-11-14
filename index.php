<?
$DOCUMENT_ROOT = '/var/www/project/dev/harviewer/webapp';
$SUB_DIR = '/hars';
if (!empty(__DIR__)) {
    $DOCUMENT_ROOT = __DIR__;
}

$arResult = array(
    'DIRS' => array(),
    'FILES' => array()
);
if (is_dir($DOCUMENT_ROOT . $SUB_DIR)) {
    $arPaths = scandir($DOCUMENT_ROOT . $SUB_DIR);
    $arFiles = array();
    foreach ($arPaths as $key => $arPath) {
        if ($key > 1) {
            if (!is_dir($DOCUMENT_ROOT . $SUB_DIR . '/' . $arPath)) {
                if (preg_match('~\.(har|harp)$~', $arPath)) {
                    $arResult['FILES'][] = $arPath;
                }
                unset($arPaths[$key]);
            }
        } else {
            unset($arPaths[$key]);
        }
    }
    if (!empty($arPaths)) {
        foreach ($arPaths as $path) {
            $arResult['DIRS'][] = $path;

        }
    }
}
$SUB_DIR = str_replace('/', '', $SUB_DIR);
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
        <div class="FrameWrapper">
            <div class="Frame Frame--2">
                <div class="FilterWrapper">
                    <? if (!empty($arResult['FILTER_DIR'])) { ?>
                    <div class="Filter js-ajaxForm" data-tab-id="1">
                        <span class="Filter__label Filter__label--folder js-pathContent">Добавить файл:<span class="Folder__path js-path" data-path="/<?=$SUB_DIR?>"><?=!empty($SUB_DIR) ? $SUB_DIR : ''?></span></span>
                        <!--<?=$arResult['FILTER_DIR']?>-->
                        <div class="Filter__folder js-folderContent">
                            <? foreach ($arResult['DIRS'] as $path) { ?>
                            <div class="Folder__item js-folderItem" data-path="/<?=$path?>">
                                <div class="Folder__name"><?=$path?></div>
                            </div>
                            <? } ?>
                        </div>
                        <span class="Filter__label Filter__label--file">Список выбранных файлов:</span>
                        <div class="FileList js-fileItems"></div>
                    </div>
                    <? } ?>
                    <button class="js-testPreview">Тест preview</button>
                    <button class="js-testHar">Тест har</button>
                    <button class="js-testFile">Тест файл</button>
                </div>
                <div class="Content">
                    <? if (!empty($arResult['FILTER_DIR'])) { ?>
                    <div class="Content__tab js-ajaxTabContent" data-tab-id="1"></div>
                    <? } ?>
                </div>

            </div><div class="Frame Frame--2">
                <div class="FilterWrapper">
                    <? if (!empty($arResult['FILTER_DIR'])) { ?>
                    <div class="Filter js-ajaxForm" data-tab-id="2">
                        <span class="Filter__label">Добавить файл:<?=!empty($SUB_DIR) ? ' (каталог ' . $SUB_DIR . '/)' : ''?></span>
                        <?=$arResult['FILTER_DIR']?>
                        <span class="Filter__label">Список выбранных файлов:</span>
                        <div class="FileList js-fileItems"></div>

                    </div>
                    <? } ?>
                    <button class="js-testPreview">Тест preview</button>
                    <button class="js-testHar">Тест har</button>
                    <button class="js-testFile">Тест файл</button>

                </div>
                <div class="Content">
                    <? if (!empty($arResult['FILTER_DIR'])) { ?>
                        <div class="Content__tab js-ajaxTabContent" data-tab-id="2"></div>
                    <? } ?>
                </div>
            </div>
        </div>
        <div class="Footer">&copy;<?=date('Y');?> ИНТ ООО САМСОН ОПТ</div>
    </div>
    <script src="scripts/jquery.js"></script>
    <script src="scripts/downloadify/js/swfobject.js"></script>
    <script src="scripts/downloadify/src/downloadify.js"></script>
    <script src="scripts/script.js"></script>
    <script data-main="scripts/harViewer" src="scripts/require.js"></script>
    <!--@GOOGLE-ANALYTICS-INCLUDE@-->
</body>
</html>
