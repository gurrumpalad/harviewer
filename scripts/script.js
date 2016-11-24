function GetPath(container, elem) {
    if ($(elem).attr('data-path') && $(elem).attr('data-path').length > 0) {
        var objSend = {
            'ajax' : 'Y',
            'DIR' : $(elem).attr('data-path')
        };
        var elem = $(elem);
        var curTime = new Date();
        //сбрасываем предыдущий запрос
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
                            var fileElem = '<div class="File__item js-fileItem" data-path="' + result['files'][i]['path'] + '"><div class="File__name">' + result['files'][i]['value'] + '</div></div>';
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

        //проводник
        $(ajaxListener).on('click', '.js-ajaxForm .js-folderContent .js-folderItem', function(){
            if ($(this).attr('data-path') && $(this).attr('data-path').length > 0) {
                var currentLasHeader = $(this).parents('.js-ajaxForm').find('.js-pathContent .js-path:last');
                if (!currentLasHeader || (currentLasHeader.attr('data-path') != $(this).attr('data-path'))) {
                    var headerElem = '<span class="Folder__path js-path" data-path="' + $(this).attr('data-path') + '">' + $(this).text() + '</span>';
                    $(this).parents('.js-ajaxForm').find('.js-pathContent').append(headerElem);
                }
            }
            GetPath($(this).parents('.js-folderContent'), $(this));
        });
        //~проводник

        //открытие файла
        $(ajaxListener).on('click', '.js-folderContent .js-fileItem', function(){
            if ($(this).attr('data-path') && $(this).attr('data-path') != '') {
                var form = $(this).parents('.js-ajaxForm');
                var tabID = form.attr('data-tab-id');
                var path = $(this).attr('data-path');
                var subdomen = '';
                if (/.*\/$/.test(document.location.pathname)) {
                    subdomen = document.location.pathname.substr(0, (document.location.pathname.length - 1));
                }
                var text = $(this).text();
                var elem = $(this);
                var tabObj = $('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').last().get(0).repObject;
                var needRemove = $(this).attr('data-remove') == 'Y';
                if (tabObj) {
                    try {
                        $.getJSON(subdomen + path, function(input){
                            tabObj.appendPreview(input, path);
                            //сброс проводника
                            if (needRemove) {
                                form.find('.js-path:first').nextAll('.js-path').remove();
                                form.find('.js-path:first').get(0).click();
                            }
                        });
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        });
        //~открытие файла

        //проводник - нажатие на ссылки в шапке
        $(ajaxListener).on('click', '.js-ajaxForm .js-path', function(){
            GetPath($(this).parents('.js-ajaxForm').find('.js-folderContent'), $(this));
            $(this).nextAll('.js-path').remove();
        });
        //~проводник - нажатие на ссылки в шапке

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

        //табы - HAR и STATS
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
        //~табы - HAR и STATS
    }
});