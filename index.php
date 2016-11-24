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
                    $arResult['FILES'][] = array(
                        'path' => $SUB_DIR . '/' . $arPath,
                        'value' => $arPath
                    );
                }
                unset($arPaths[$key]);
            }
        } else {
            unset($arPaths[$key]);
        }
    }
    if (!empty($arPaths)) {
        foreach ($arPaths as $path) {
            $arResult['DIRS'][] = array(
                'path' => $SUB_DIR . '/' . $path,
                'value' => $path
            );
        }
    }
}
$SUB_DIR = str_replace('/', '', $SUB_DIR);
header("Content-Type: text/html; charset=utf-8");
?>
<!doctype html>
<html>
<head>
    <title>Просмотрщик HTTP архивов - ИНТ</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
    <link rel="stylesheet" href="css/harViewer.css" type="text/css">
</head>
<body class="js-ajaxListener">
    <div class="Wrapper">
        <div class="FrameWrapper">
            <div class="Frame">
                <div class="FilterWrapper">
                    <div class="Filter js-ajaxForm" data-tab-id="1">
                        <span class="Filter__label Filter__label--folder js-pathContent">Добавить файл:<span class="Folder__path js-path" data-path="/<?=$SUB_DIR?>"><?=!empty($SUB_DIR) ? $SUB_DIR : ''?></span></span>
                        <div class="Filter__folder js-folderContent">
                            <? foreach ($arResult['DIRS'] as $path) { ?>
                            <div class="Folder__item js-folderItem" data-path="<?=$path['path']?>">
                                <div class="Folder__name"><?=$path['value']?></div>
                            </div>
                            <? } ?>
                            <? foreach ($arResult['FILES'] as $path) { ?>
                                <div class="File__item js-fileItem" data-path="<?=$path['path']?>">
                                    <div class="File__name"><?=$path['value']?></div>
                                </div>
                            <? } ?>
                        </div>
                        <span class="Filter__label Filter__label--file">Список выбранных файлов:</span>
                        <div class="FileList js-fileItems"></div>
                    </div>

                    <button class="ViewButton active js-viewToggle" data-tab-id="1" data-tab-name="Preview1">ТАБЛИЦЫ</button>
                    <button class="ViewButton js-viewToggle" data-tab-id="1" data-tab-name="DOM1">ДЕРЕВО</button>
                    <button class="ViewButton ViewButton--second js-doubleView">ДВА ОКНА</button>
                </div>
                <div class="Content">
                    <div class="Content__tab js-ajaxTabContent" data-tab-id="1"></div>
                </div>
            </div><div class="Frame" style="display: none;">
                <div class="FilterWrapper">
                    <div class="Filter js-ajaxForm" data-tab-id="2">
                        <span class="Filter__label Filter__label--folder js-pathContent">Добавить файл:<span class="Folder__path js-path" data-path="/<?=$SUB_DIR?>"><?=!empty($SUB_DIR) ? $SUB_DIR : ''?></span></span>
                        <div class="Filter__folder js-folderContent">
                            <? foreach ($arResult['DIRS'] as $path) { ?>
                                <div class="Folder__item js-folderItem" data-path="<?=$path['path']?>">
                                    <div class="Folder__name"><?=$path['value']?></div>
                                </div>
                            <? } ?>
                            <? foreach ($arResult['FILES'] as $path) { ?>
                                <div class="File__item js-fileItem" data-path="<?=$path['path']?>">
                                    <div class="File__name"><?=$path['value']?></div>
                                </div>
                            <? } ?>
                        </div>
                        <span class="Filter__label Filter__label--file">Список выбранных файлов:</span>
                        <div class="FileList js-fileItems"></div>
                    </div>

                    <button class="ViewButton active js-viewToggle" data-tab-id="2" data-tab-name="Preview2">ТАБЛИЦЫ</button>
                    <button class="ViewButton js-viewToggle" data-tab-id="2" data-tab-name="DOM2">ДЕРЕВО</button>
                    <button class="ViewButton ViewButton--second js-singleView">ОДНО ОКНО</button>
                </div>
                <div class="Content">
                    <div class="Content__tab js-ajaxTabContent" data-tab-id="2"></div>
                </div>
            </div>
        </div>
        <div class="Footer">&copy;<?=date('Y');?> ИНТ ООО САМСОН ОПТ</div>
    </div>
    <script src="scripts/jquery.js"></script>
    <script src="scripts/ui/jquery-ui.js"></script>
    <script src="scripts/downloadify/js/swfobject.js"></script>
    <script src="scripts/downloadify/src/downloadify.js"></script>
    <script src="scripts/script.js"></script>
    <script data-main="scripts/harViewer" src="scripts/require.js"></script>
</body>
</html>
