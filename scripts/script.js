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

function GetPath(container, elem) {
    if ($(elem).attr('data-path') && $(elem).attr('data-path').length > 0) {
        var objSend = {
            'ajax' : 'Y',
            'DIR' : $(elem).attr('data-path')
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
                    $(container).html('');
                } catch (e) {
                    console.log(e);
                }
                if (result['dirs'] != null && result['dirs'].length > 0) {
                    for (var i = 0; i < result['dirs'].length; i++) {
                        if (result['dirs'][i] && result['dirs'][i]['path'] && result['dirs'][i]['value']) {
                            var dirElem = '<div class="Folder__item js-folderItem" data-path="' + result['dirs'][i]['path'] + '"><div class="Folder__name">' + result['dirs'][i]['value'] + '</div></div>';
                            $(container).append(dirElem);
                        }
                    }
                }
                if (result['files'] != null && result['files'].length > 0) {
                    for (var i = 0; i < result['files'].length; i++) {
                        if (result['files'][i] && result['files'][i]['path'] && result['files'][i]['value']) {
                            var fileElem = '<div class="Folder__item js-fileItem" data-path="' + result['files'][i]['path'] + '"><div class="Folder__name">' + result['files'][i]['value'] + '</div></div>';
                            $(container).append(fileElem);
                        }
                    }
                }
            }
        });
    }
}
$(document).ready(function(){
    if ($('.js-ajaxForm').length > 0 && $('.js-ajaxListener').length > 0) {
        var ajaxListener = $('.js-ajaxListener');
        /*$('.js-ajaxListener').on('change', '.js-ajaxForm .js-checkFile', function(){
            //GetPath($(this));
        });*/
        $(ajaxListener).on('click', '.js-ajaxForm .js-folderContent .js-folderItem', function(){
            if ($(this).attr('data-path') && $(this).attr('data-path').length > 0) {
                var headerElem = '<span class="Folder__path js-path" data-path="' + $(this).attr('data-path') + '">' + $(this).text() + '</span>';
                $(this).parents('.js-ajaxForm').find('.js-pathContent').append(headerElem);
            }
            GetPath($(this).parents('.js-folderContent'), $(this));
        });
        //открытие файла
        $(ajaxListener).on('click', '.js-folderContent .js-fileItem', function(){
            if ($(this).attr('data-path') && $(this).attr('data-path') != '') {
                var form = $(this).parents('.js-ajaxForm');
                var tabID = form.attr('data-tab-id');
                var path = $(this).attr('data-path');
                var text = $(this).text();
                var elem = $(this);
                var fileItems = form.find('.js-fileItems');
                var tabObj = $('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').last().get(0).repObject;
                if (tabObj) {
                    try {
                        $.getJSON(path, function(input){
                            tabObj.appendPreview(input);
                            fileItems.append('<div class="FileItem js-fileItem" data-file-path="' + path + '">' + path + '<div class="FileItem__remove js-fileRemove">Удалить</div></div>');
                            form.find('.js-path:first').nextAll('.js-path').remove();
                            form.find('.js-path:first').get(0).click();
                        });
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        });
        $(ajaxListener).on('click', '.js-ajaxForm .js-path', function(){
            GetPath($(this).parents('.js-ajaxForm').find('.js-folderContent'), $(this));
            $(this).nextAll('.js-path').remove();
        });
        $(ajaxListener).on('click', '.js-ajaxForm .js-fileRemove', function(){
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
        //переключение вида
        $(ajaxListener).on('click', '.js-doubleView', function () {
            $(this).hide();
            $('.Frame').each(function(){
                $(this).addClass('Frame--2').css('display', 'inline-block');
            });
            $('.js-singleView').show();
        });
        $(ajaxListener).on('click', '.js-singleView', function () {
            $(this).hide();
            $('.Frame').each(function(){
                $(this).removeClass('Frame--2').css('display', 'block');
            });
            $('.Frame:last').hide();
            $('.js-doubleView').show();
        });
        //~переключение вида
        $(ajaxListener).on('click', '.js-viewStats', function () {
            var toggle = $(this).parent().find('.js-viewToggle');
            var tabID = $(this).attr('data-tab-id');
            var tabObj = $('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').last().get(0).repObject;
            if (tabObj) {
                var previewTab = tabObj.getTab("Preview" + tabID);
                if (previewTab) {
                    toggle.toggleClass('active');
                    previewTab.select();
                }

            }
        });
        $(ajaxListener).on('click', '.js-viewToggle', function () {
            $(this).parent().find('.js-viewToggle.active').removeClass('active');
            $(this).addClass('active');
            var tabID = $(this).attr('data-tab-id');
            var tabName = $(this).attr('data-tab-name');
            var tabObj = $('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').last().get(0).repObject;
            if (tabObj) {
                var harTab = tabObj.getTab(tabName);
                if (harTab) {
                    harTab.select();
                }
            }
        });
        /*$(ajaxListener).on('click', '.js-testFile', function () {
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

        });*/
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