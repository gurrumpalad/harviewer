//функция для перезагрузки контента по ajax
function ReloadAjaxContent(url, objSend, isSetHistory, callback)
{
    if (url.length <= 0) {
        url = document.location.pathname;
    }
    if ('append' in objSend) {
        objSend.append('ajax', 'Y');
    } else {
        objSend['ajax'] = 'Y';
    }
    var curTime = new Date();
    //сбразываем предыдущий запрос
    if (window.ajaxSend) {
        window.ajaxSend.abort();
    }
    //отправляем запрос
    window.ajaxSend = $.ajax({
        url: url,
        type: 'POST',
        data: objSend,
        processData: 'append' in objSend ? false : true,
        contentType: 'append' in objSend ? false : 'application/x-www-form-urlencoded',
        cache: false,
        dataType: 'html',
        success: function(result) {
            curTime = curTime + 300 - new Date();
            window.setTimeout(function(){
                //обновляем контент
                $('.js-ajaxContent').html(result);
                if (isSetHistory && history.pushState && typeof(history.pushState) === 'function') {
                    window.history.pushState(null, null, url);
                }
                if (callback && typeof(callback) === 'function') {
                    callback();
                }
                //убираем загрузчик
                curTime = false;
            }, curTime > 0 ? curTime : 0);
        }
    });
}

function GetPath(elem) {
    $(elem).nextAll('.js-checkFile, .js-viewFile').remove();
    if ($(elem).val() && $(elem).val() != '') {
        var objSend = {
            'ajax' : 'Y',
            'DIR' : $(elem).val()
        };
        //var form = $(elem).parents('.js-ajaxForm');
        var elem = $(elem);
        var curTime = new Date();
        //сбразываем предыдущий запрос
        if (window.ajaxSend) {
            window.ajaxSend.abort();
        }
        //отправляем запрос
        window.ajaxSend = $.ajax({
            url: 'ajax.php',
            type: 'POST',
            data: objSend,
            processData: true,
            contentType: 'application/x-www-form-urlencoded',
            cache: false,
            dataType: 'html',
            success: function(result) {
                try {
                    result = JSON.parse(result);
                } catch (e) {
                    console.log(e);
                }
                if (result['html'] != null && result['html'].length > 0) {
                    curTime = curTime + 300 - new Date();
                    window.setTimeout(function(){
                        //обновляем контент
                        $(elem).nextAll('.js-checkFile').remove();
                        $(elem).after(result['html']);
                        //убираем загрузчик
                        curTime = false;
                    }, curTime > 0 ? curTime : 0);
                }
            }
        });
    }
}
$(document).ready(function(){
    if ($('.js-ajaxForm').length > 0 && $('.js-ajaxListener').length > 0) {
        /*$('.js-ajaxListener').on('change', '.js-ajaxForm .js-checkFile', function(){
            //GetPath($(this));
        });*/
        $('.js-ajaxListener').on('click', '.js-ajaxForm .js-checkFile option', function(){
            GetPath($(this).parents('.js-checkFile'));
        });
        $('.js-ajaxListener').on('change', '.js-ajaxForm .js-viewFile', function(){
            if ($(this).val() && $(this).val() != '') {
                var form = $(this).parents('.js-ajaxForm');
                var tabID = form.attr('data-tab-id');
                var elem = $(this);
                var fileItems = form.find('.js-fileItems');
                var tabObj = $('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').last().get(0).repObject;
                if (tabObj) {
                    try {
                        $.getJSON($(this).val(), function(input){
                            tabObj.appendPreview(input);
                            fileItems.append('<div class="FileItem js-fileItem" data-file-path="' + $(elem).val() + '">' + $(elem).val() + '<div class="FileItem__remove js-fileRemove">Удалить</div></div>');
                            form.find('.js-checkFile:first').nextAll('.js-checkFile, .js-viewFile').remove();
                        });
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        });
        $('.js-ajaxListener').on('click', '.js-ajaxForm .js-fileRemove', function(){
            var form = $(this).parents('.js-ajaxForm');
            var tabID = form.attr('data-tab-id');
            var filePath = $(this).parents('.js-fileItem').attr('data-file-path');
            $(this).parents('.js-fileItem').remove();
            var tabObj = $('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').last().get(0).repObject;
            if (tabObj) {
                var pages = tabObj.model.getPages();
                if (pages) {
                    try {
                        $.getJSON(filePath, function(input){
                            var obj = tabObj.removeHarFile(input);
                            if (obj) {
                                tabObj.initialize($('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').last().get(0), obj);
                            } else {
                                tabObj.initialize($('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').last().get(0));
                            }
                        });
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        });
        $('.js-ajaxListener').on('click', '.js-test', function () {
            console.log('click');
            var tabObj = $('.js-ajaxTabContent[data-tab-id="1"]').last().get(0).repObject;
            if (tabObj) {
                var pages = tabObj.model.input;
                console.log(pages);
            }
        });
        $('.js-ajaxListener').on('click', '.js-testPreview', function () {
            var tabObj = $('.js-ajaxTabContent[data-tab-id="1"]').last().get(0).repObject;
            if (tabObj) {
                var previewTab = tabObj.getTab("Preview1");
                previewTab.select();
            }
        });
        $('.js-ajaxListener').on('click', '.js-testHar', function () {
            var tabObj = $('.js-ajaxTabContent[data-tab-id="1"]').last().get(0).repObject;
            if (tabObj) {
                var previewTab = tabObj.getTab("DOM1");
                previewTab.select();
                //tabObj.model.input;
                //console.log(pages);
            }
        });
        $('.js-ajaxListener').on('click', '.js-testFile', function () {
            var tabObj = $('.js-ajaxTabContent[data-tab-id="1"]').last().get(0).repObject;
            var form = $('.js-ajaxForm');
            var tabID = form.attr('data-tab-id');
            var elem = $(this);
            var fileItems = form.find('.js-fileItems');

            if (tabObj) {
                try {
                    $.getJSON('/hars/mg/2016/11/07/result.har', function(input){
                        tabObj.appendPreview(input);
                        fileItems.append('<div class="FileItem js-fileItem" data-file-path="' + '/hars/mg/2016/11/07/result.har' + '">' + '/hars/mg/2016/11/07/result.har' + '<div class="FileItem__remove js-fileRemove">Удалить</div></div>');
                        form.find('.js-checkFile:first').nextAll('.js-checkFile, .js-viewFile').remove();
                    });
                } catch (e) {
                    console.log(e);
                }
            }

        });
    }
    /*if ($(".harDownloadButton").length > 0) {
        $(".harDownloadButton").downloadify({
            filename: function() {
                return "netData.har";
            },
            data: function() {
                return model ? model.toJSON() : "";
            },
            onComplete: function() {},
            onCancel: function() {},
            onError: function() {
                Trace.log(Strings.downloadError);
                //alert(Strings.downloadError);
            },
            swf: "../../scripts/downloadify/media/downloadify.swf",
            downloadImage: "../../css/images/download-sprites.png",
            width: 16,
            height: 16,
            transparent: true,
            append: false
        });
    }*/
});