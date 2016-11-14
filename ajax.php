<?php
/**
 * Created by PhpStorm.
 * User: bayzhanov
 * Date: 08.11.16
 * Time: 16:30
 */

$DOCUMENT_ROOT = '/var/www/project/dev/harviewer/webapp';
$SUB_DIR = '/hars';
if (!empty(__DIR__)) {
    $DOCUMENT_ROOT = __DIR__;
}
$arResult = array(
    'files' => array(),
    'dirs' => array()
);
if (isset($_REQUEST['ajax'])) {
    if (isset($_REQUEST['DIR'])) {
        if (is_dir($DOCUMENT_ROOT  . $_REQUEST['DIR'])) {
            $arPaths = scandir($DOCUMENT_ROOT . $_REQUEST['DIR']);
            $arFiles = array();
            foreach ($arPaths as $key => $arPath) {
                if ($key > 1) {
                    if (!is_dir($DOCUMENT_ROOT . $_REQUEST['DIR'] . '/' . $arPath)) {
                        if (preg_match('~\.(har|harp)$~', $arPath)) {
                            $arResult['files'][] = array(
                                'path' => $_REQUEST['DIR'] . '/' . $arPath,
                                'value' => $arPath
                            );
                            //$arFiles[] = $arPath;
                        }
                        unset($arPaths[$key]);
                    }
                } else {
                    unset($arPaths[$key]);
                }
            }
            if (!empty($arPaths)) {
                //$html = '<select class="Filter__folder js-checkFile"><option value="" selected="selected">Не выбрано</option>';
                foreach ($arPaths as $path) {
                    $arResult['dirs'][] = array(
                        'path' => $_REQUEST['DIR'] . '/' . $path,
                        'value' => $path
                    );
                    //$html .= '<option value="' . $_REQUEST['DIR'] . '/' . $path . '">' . $path . '</option>';
                }
                //$html .= '</select>';
                /*echo json_encode(
                    array(
                        'html' => $html
                    )
                );*/
            } /*elseif (!empty($arFiles)) {
                $html = '<select class="Filter__folder js-viewFile"><option value="" selected="selected">Не выбрано</option>';
                foreach ($arFiles as $path) {
                    $html .= '<option value="' . $_REQUEST['DIR'] . '/' . $path . '">' . $path . '</option>';
                }
                $html .= '</select>';
                echo json_encode(
                    array(
                        'html' => $html
                    )
                );
            }*/
        }
    }
    echo json_encode($arResult);
    exit;
}