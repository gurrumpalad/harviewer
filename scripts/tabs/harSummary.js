/* See license.txt for terms of usage */

/**
 * @module tabs/harStats
 */
define("tabs/harSummary", [
    "domplate/domplate",
    "core/lib",
    "core/StatsService",
    "i18n!nls/harSummary",
    "preview/harModel",
    "core/trace",
    "core/url"
],

function(Domplate, Lib, StatsService, Strings, HarModel, Trace, Url) {

var domplate = Domplate.domplate;
var DIV = Domplate.DIV;
var FOR = Domplate.FOR;
var TAG = Domplate.TAG;
var SPAN = Domplate.SPAN;
var A = Domplate.A;

//*************************************************************************************************
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

function Summary(model)
{
    this.model = model;
}

/**
 * @domplate Template for statistics section (pie graphs)
 */
Summary.prototype = domplate(
/** @lends Stats */
{
    element: null,
    parentElem: null,

    tag:
        DIV({"class": "pageSummaryBody $obj.class"},
            DIV({"class": "pageSummaryHeader"},
                FOR("page", "$obj.pages",
                    DIV({"class": "Summary__header"},
                        A({"class": "header__Title", "href": "$page.header.title"}, "$page.header.title"),
                        SPAN({"class": "header__Time"}, "$page.header.time")
                    )
                )
            ),
            FOR("entry", "$obj.entries",
                TAG("$entryTag", {pages: "$entry"})
            ),
            FOR("resume", "$obj.resumes",
                TAG("$blockTag", {pages: "$resume"})
            ),
            DIV({"class": "pageSummaryFooter"},
                    FOR("page", "$obj.pages",
                        DIV({"class": "Summary__header"},
                            A({"class": "header__Title", "href": "$page.header.title"}, "$page.header.title"),
                            SPAN({"class": "header__Time"}, "$page.header.time")
                        )
                    )
            )
        ),

    entryTag:
        DIV({"class": "SummaryEntry"},
            FOR("page", "$pages",
                DIV({"class": "Summary__entry $page.class"},
                    A({"class": "entry__Title", "href": "$page.content.href"}, "$page.content.title"),
                    SPAN({"class": "entry__Time $page.content.ctime"}, "$page.content.time"),
                    SPAN({"class": "entry__Size $page.content.csize"}, "$page.content.size")
                )
            )
        ),

    blockTag:
        DIV({"class": "SummaryResume"},
            FOR("page", "$pages",
                DIV({"class": "Resume__entry $page.class"},
                    FOR("resum", "$page.content",
                        SPAN({"class": "resumeBlock $resum.class"}, "$resum.content")
                    )
                )
            )
        ),


    update: function()
    {
        if (!this.isVisible())
            return;

        var obj = this.getObjEntry();
        this.element = this.tag.replace({obj: obj}, this.parentElem);
        Lib.setClass(this.element, "opened");
    },

    cleanUp: function()
    {
        timingPie.cleanUp();
        contentPie.cleanUp();
        trafficPie.cleanUp();
        cachePie.cleanUp();
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Timeline Listener

    onSelectionChange: function(pages)
    {
        this.update(pages);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Public

    show: function(animation)
    {
        if (this.isVisible())
            return;

        Lib.setClass(this.element, "opened");

        if (!animation)
            this.element.style.display = "block";
        else
            $(this.element).slideDown();

        this.update();

    },

    hide: function(animation)
    {
        if (!this.isVisible())
            return;

        Lib.removeClass(this.element, "opened");

        if (!animation)
            this.element.style.display = "none";
        else
            $(this.element).slideUp();
    },

    isVisible: function()
    {
        return Lib.hasClass(this.element, "opened");
    },

    toggle: function(animation)
    {
        if (this.isVisible())
            this.hide(animation);
        else
            this.show(animation);
    },

    append: function(input) {
        this.update();
    },

    getObjEntry: function()
    {
        var obj = {};

        if (this.model) {

            var pages = this.model.getPages();
            var modelEntries = this.model.getAllEntries();
            var allEntries = {};
            var enToPages = {};
            var pageToEntry = {};
            for (var j = 0; j < modelEntries.length; j++) {
                if (
                    modelEntries[j]
                    && modelEntries[j].pageref
                    && modelEntries[j].request
                    && modelEntries[j].request.url
                    && modelEntries[j].request.url.length > 0
                ) {

                    var localDomen = Url.getPrettyDomain(modelEntries[j].request.url);

                    var localUrl = modelEntries[j].request.url;
                    if (localDomen.length > 0) {
                        var curRequest = localUrl.substr((localUrl.indexOf(localDomen) + localDomen.length));
                        if (curRequest.length > 0) {
                            if (/([^0-9]+)\.[0-9]+\.(css|js)$/.test(curRequest)) {
                                curRequest = curRequest.replace(/([^0-9]+)\.[0-9]+\.(css|js)$/, "$1.$2");
                            }
                            localUrl = localDomen + curRequest;
                        }
                    }

                    //страницы к запросам
                    if (enToPages[modelEntries[j].pageref] === undefined) {
                        enToPages[modelEntries[j].pageref] = {};
                    }
                    if (enToPages[modelEntries[j].pageref][localUrl] === undefined) {
                        enToPages[modelEntries[j].pageref][localUrl] = modelEntries[j];
                    } else {

                        var iter = 1;
                        while (enToPages[modelEntries[j].pageref][(localUrl + '' + Number(++iter))]) {};
                        localUrl = localUrl + '' + iter;
                        enToPages[modelEntries[j].pageref][localUrl] = modelEntries[j];
                    }

                    //запросы к страницам
                    if (pageToEntry[localUrl] === undefined) {
                        pageToEntry[localUrl] = {};
                    }
                    if (pageToEntry[localUrl][modelEntries[j].pageref] === undefined) {
                        pageToEntry[localUrl][modelEntries[j].pageref] = modelEntries[j];
                    }



                    if (allEntries[localUrl] === undefined) {
                        allEntries[localUrl] = modelEntries[j];
                    } /*else {
                        var iter = 1;
                        while (allEntries[(localUrl + '' + Number(++iter))]) {};
                        allEntries[(localUrl + '' + iter)] = modelEntries[j];
                    }*/
                }
            }
            obj['pages'] = []; // header
            obj['entries'] = []; // [class, content] ..
            obj['resumes'] = []; // [class, content] ..

            var timing = [];
            var sizing = [];
            var requests = [];
            for (var i = 0; i < pages.length; i++) {
                if (pages[i] && pages[i].id) {
                    //добавляем заголовок для страницы
                    var curPageHeader = {title: '', time: ''};
                    var curDomen = "";
                    if (pages[i].title) {
                        curPageHeader.title = pages[i].title;
                        curDomen = Url.getPrettyDomain(pages[i].title);
                    }
                    if (pages[i].startedDateTime) {
                        var pageStart = Lib.parseISO8601(pages[i].startedDateTime);
                        var date = new Date(pageStart);
                        curPageHeader.time = date.toLocaleString();
                    }
                    obj['pages'].push({header: curPageHeader});

                    //тайминг
                    var curTiming = [];
                    var onLoad = pages[i].pageTimings.onLoad;
                    if (onLoad > 0)
                        curTiming.push({class:"Page__load", content: Strings.pageLoad + ": " + Lib.formatTime(onLoad.toFixed(2))});

                    onLoad = pages[i].pageTimings.onContentLoad;
                    if (onLoad > 0)
                        curTiming.push({class:"Page__domLoad", content: Strings.domLoad + ": " + Lib.formatTime(onLoad.toFixed(2))});

                    requests[i] = HarModel.getPageEntries(this.model.input, pages[i]);
                    var docRequest = requests[i][0] ? requests[i][0] : null;
                    if (docRequest && docRequest.time) {
                        curTiming.push({class:"Page__serverPing", content: Strings.serverTime + ": " + Lib.formatTime(docRequest.time.toFixed(2))});
                    }
                    var curSizing = [];
                    var pageSizing = this.processor({entries: requests[i]}, pages[i].startedDateTime, curDomen);

                    var minTime = 0;
                    var maxTime = 0;
                    curSizing.push(
                        {
                            class:"Page__docSize",
                            content: "Размер документа: " + Lib.formatSize(pageSizing.document_size)
                        }
                    );

                    curSizing.push(
                        {
                            class:"Page__docCount",
                            content: "Общее количество: " + Number(pageSizing.total_entries_own + pageSizing.total_entries_third)
                                + ", своих " + pageSizing.total_entries_own + ", чужих " + pageSizing.total_entries_third
                        }
                    );
                    curSizing.push(
                        {
                            class:"Page__totalSize",
                            content: "Размер: " + Lib.formatSize(Number(pageSizing.total_download_own + pageSizing.total_download_third))
                            + ", своих " + Lib.formatSize(pageSizing.total_download_own) + ", чужих " + Lib.formatSize(pageSizing.total_download_third)
                        }
                    );

                    curSizing.push(
                        {
                            class:"Page__styleCount",
                            content: "Количество стилей: " + Number(pageSizing.style_count_own + pageSizing.style_count_third)
                            + ", своих " + pageSizing.style_count_own + ", чужих " + pageSizing.style_count_third
                        }
                    );
                    curSizing.push(
                        {
                            class:"Page__styleSize",
                            content: "Размер стилей: " + Lib.formatSize(Number(pageSizing.style_size_own + pageSizing.style_size_third))
                            + ", своих " + Lib.formatSize(pageSizing.style_size_own) + ", чужих " + Lib.formatSize(pageSizing.style_size_third)
                        }
                    );


                    curSizing.push(
                        {
                            class:"Page__scriptCount",
                            content: "Количество скриптов: " + Number(pageSizing.script_count_own + pageSizing.script_count_third)
                            + ", своих " + pageSizing.script_count_own + ", чужих " + pageSizing.script_count_third
                        }
                    );
                    curSizing.push(
                        {
                            class:"Page__scriptSize",
                            content: "Размер скриптов: " + Lib.formatSize(Number(pageSizing.script_size_own + pageSizing.script_size_third))
                            + ", своих " + Lib.formatSize(pageSizing.script_size_own) + ", чужих " + Lib.formatSize(pageSizing.script_size_third)
                        }
                    );


                    curSizing.push(
                        {
                            class:"Page__imgCount",
                            content: "Количество изображений: " + Number(pageSizing.count_img_own + pageSizing.count_img_third)
                            + ", своих " + pageSizing.count_img_own + ", чужих " + pageSizing.count_img_third
                        }
                    );
                    curSizing.push(
                        {
                            class:"Page__imgSize",
                            content: "Размер изображений: " + Lib.formatSize(Number(pageSizing.size_img_own + pageSizing.size_img_third))
                            + ", своих " + Lib.formatSize(pageSizing.size_img_own) + ", чужих " + Lib.formatSize(pageSizing.size_img_third)
                        }
                    );

                    for (var k = 0; k < requests[i].length; k++) {
                        if (requests[i][k]) {
                            var startedDateTime = Lib.parseISO8601(requests[i][k].startedDateTime);
                            if (!minTime || startedDateTime < minTime) {
                                minTime = startedDateTime;
                            }
                            var fileEndTime = startedDateTime + requests[i][k].time;
                            if (fileEndTime > maxTime) {
                                maxTime = fileEndTime;
                            }
                        }
                    }
                    var totalTime = maxTime - minTime;
                    curTiming.push({class:"Page__totalTime", content: Strings.finishTime + ": " + Lib.formatTime(totalTime.toFixed(2))});
                    timing.push({class: "Resume__timing", content: curTiming});
                    sizing.push({class: "Resume__sizing", content: curSizing});

                }
            }

            obj['resumes'].push(timing);
            obj['resumes'].push(sizing);

            obj['class'] = 'summaryPage--' + obj['pages'].length;

            //добавляем содержимое
            var entry = null;
            var tempEntries = [];
            for (entry in allEntries) {
                var curRowEntry = [];
                var curRowWeight = 0;
                var curRowCount = 0;
                var curMaxTime = 0;
                var curMinTime = 2048000000;
                var curMaxSize = 0;
                var curMinSize = 2048000000;
                for (var i = 0; i < pages.length; i++) {
                    if (pages[i] && pages[i].id) {
                        var localRowWeight = 0;
                        var curEntryContent = {time: '', ctime: '', vtime: 0, title: '', size: '', csize: '', vsize: 0, href: ''};
                        var curEntryClass = "Deleted";
                        if (enToPages[pages[i].id] && enToPages[pages[i].id][entry]) {
                            //заголовок
                            var localEntry = enToPages[pages[i].id][entry];
                            if (!requests[i]) {
                                requests[i] = HarModel.getPageEntries(this.model.input, pages[i]);
                            }
                            var curCounter = 0;
                            if (enToPages[pages[i].id][(entry.substr(0, entry.length - 1))]) {
                                curCounter = Number(entry.substr(entry.length - 1));
                            }
                            for (var loc = 0; loc < requests[i].length; loc++) {
                                if (
                                    requests[i][loc]
                                    && requests[i][loc].request.url
                                    && requests[i][loc].request.url.replace(/^https/, 'http') == localEntry.request.url.replace(/^https/, 'http')
                                ) {
                                    if (curCounter > 1) {
                                        curCounter--;
                                    } else {
                                        localRowWeight = Number(loc + 1);
                                        curRowCount++;
                                        break;
                                    }
                                }
                            }
                            curEntryContent.href = localEntry.request.url;
                            var curEntry = localEntry.request.url;
                            var curDomen = '';
                            if (pages[i].title) {
                                curDomen = Url.getPrettyDomain(pages[i].title);
                                if (curDomen.length > 0 && curEntry.indexOf(curDomen) >= 0) {
                                    curEntry = curEntry.substr((curEntry.indexOf(curDomen) + curDomen.length));
                                    if (curEntry.length <= 0 || curEntry == '/') {
                                        curEntry = pages[i].title;
                                    }
                                }
                            }
                            curEntryContent.title = Number(localRowWeight)  + ': ' + curEntry;
                            curEntryClass = "Added";
                            //время
                            curEntryContent.time = '';
                            if (localEntry.time) {
                                curEntryContent.time = Strings.timeLoad + ": " + Lib.formatTime(localEntry.time.toFixed(2));
                                curEntryContent.vtime = localEntry.time.toFixed(2);
                                if (localEntry.time.toFixed(2) > curMaxTime) {
                                    curMaxTime = localEntry.time.toFixed(2);
                                }
                                if (localEntry.time.toFixed(2) < curMinTime) {
                                    curMinTime = localEntry.time.toFixed(2);
                                }
                            }
                            //размер
                            var bodySize = localEntry.response.bodySize;
                            var size = (bodySize && bodySize !== -1) ? bodySize : localEntry.response.content.size;
                            curEntryContent.size = Strings.sizeContent + ": " + Lib.formatSize(size);
                            curEntryContent.vsize = size;
                            if (size > curMaxSize) {
                                curMaxSize = size;
                            }
                            if (size < curMinSize) {
                                curMinSize = size;
                            }
                        }

                        curRowEntry.push({class: curEntryClass, content: curEntryContent});

                        if (curRowWeight == 0 && localRowWeight > 0) {
                            curRowWeight = curRowCount + ((localRowWeight - 1) * pages.length);
                        }
                    }
                }

                //убираем класс у одинаковых элементов
                var entryClass = 'Added';
                var countClass = 0;
                for (var m = 0; m < pages.length; m++) {
                    if (curRowEntry[m]) {
                        if (curRowCount > 1 && curRowEntry[m].content && curRowEntry[m].content.vsize && curRowEntry[m].content.vtime) {
                            if (curMinSize != curMaxSize) {
                                if (curRowEntry[m].content.vsize == curMinSize) {
                                    curRowEntry[m].content.csize = 'entry__Size--good';
                                } else if (curRowEntry[m].content.vsize == curMaxSize) {
                                    curRowEntry[m].content.csize = 'entry__Size--bad';
                                }
                            }
                            if (curMinTime != curMaxTime) {
                                if (curRowEntry[m].content.vtime == curMinTime) {
                                    curRowEntry[m].content.ctime = 'entry__Time--good';
                                } else if (curRowEntry[m].content.vtime == curMaxTime) {
                                    curRowEntry[m].content.ctime = 'entry__Time--bad';
                                }
                            }
                        }
                        if (curRowEntry[m].class && curRowEntry[m].class == entryClass) {
                            countClass++;
                        }
                    }
                }
                if (countClass == pages.length) {
                    for (var m = 0; m < pages.length; m++) {
                        if (curRowEntry[m] && curRowEntry[m].class) {
                            curRowEntry[m].class = '';
                        }
                    }
                }
                if (tempEntries[curRowWeight]) {
                    while (tempEntries[(--curRowWeight)] && curRowWeight > 0) {};
                }
                if (tempEntries[curRowWeight]) {
                    while (tempEntries[(++curRowWeight)]) {};
                }
                tempEntries[curRowWeight] = curRowEntry;
            }
            for (var key = 0; key < tempEntries.length; key++) {
                if (tempEntries[key]) {
                    obj['entries'].push(tempEntries[key]);
                }
            }
        }
        return obj;
    },



    processor: function (harClean, startTime, domen) {

        // ищем важное в харах
        var data = this.getData(harClean, startTime, domen);
        //var dataCache = getData(harCache);

        return {

            // время
           /* server_time: data.time.server,
            dom_content_load: data.time.DOMContentLoaded,
            onload: data.time.load,
            finish_time: data.time.finish,
            */
            // всего загружено
            total_download_own: data.data.total.size - data.data.third.size,
            total_download_third: data.data.third.size,

            // всего запросов
            total_entries_own: data.data.total.entries.length - data.data.third.entries.length,
            total_entries_third: data.data.third.entries.length,

            // размер документа
            document_size: data.data.documentSize,

            // размер стилей
            style_size_own: data.data.styles.size - data.data.third.styles.size,
            style_size_third: data.data.third.styles.size,

            // запросы стилей
            style_count_own: data.data.styles.entries.length - data.data.third.styles.entries.length,
            style_count_third: data.data.third.styles.entries.length,

            // размер скриптов
            script_size_own: data.data.scripts.size - data.data.third.scripts.size,
            script_size_third: data.data.third.scripts.size,

            // запросы скриптов
            script_count_own: data.data.scripts.entries.length - data.data.third.scripts.entries.length,
            script_count_third: data.data.third.scripts.entries.length,

            // размер изображений
            size_img_own: data.data.images.size - data.data.third.images.size,
            size_img_third: data.data.third.images.size,

            // запросы изображений
            count_img_own: data.data.images.entries.length - data.data.third.images.entries.length,
            count_img_third: data.data.third.images.entries.length
            /*
            // время c кешем
            dom_content_load_cache: dataCache.time.DOMContentLoaded,
            onload_cache: dataCache.time.load,
            finish_time_cache: dataCache.time.finish,

            // размер с кешем
            total_download_cache: dataCache.data.total.sizeTransfer
            */
        };
    },

    getData: function(har, startTime, domen)
    {
        var data = har;
        if (domen.length <= 0) {
            domen = 'officemag.ru/';
        }
        var preg = new RegExp(domen);

        var total = 0;
        var totalThird = 0;
        var totalTransfer = 0;

        var totalImg = 0;
        var totalImgThird = 0;

        var totalJpg = 0;
        var totalPng = 0;
        var totalGif = 0;

        var totalStyle = 0;
        var totalStyleThird = 0;

        var totalScript = 0;
        var totalScriptThird = 0;

        var styles = [];
        var stylesThird = [];

        var scripts = [];
        var scriptsThird = [];

        var images = [];
        var imagesThird = [];

        var third = [];

        var start = new Date(startTime).getTime();
        var uniqEntry = [];
        var finish = 0;

        var that = this;

        data.entries.forEach(function (entry) {
            var sizeEncoded = that.getEncodedSize(entry);
            var sizeTransfer = that.getTransferSize(entry);
            var sizeDecoded = entry.response.content.size;

            total += sizeEncoded;
            totalTransfer += sizeTransfer;

            if (
                uniqEntry.indexOf(entry.request.url) === -1
                && finish < new Date(entry.startedDateTime).getTime() - start + entry.time
            ) {
                uniqEntry.push(entry.request.url);
                finish = new Date(entry.startedDateTime).getTime() - start + entry.time;
            }

            if (entry.response.content.mimeType.match(/image.*/)) {
                images.push(entry);
                totalImg += sizeEncoded;

                if (entry.response.content.mimeType.match(/jpeg/)) {
                    totalJpg += sizeEncoded;
                }
                else if (entry.response.content.mimeType.match(/png/)) {
                    totalPng += sizeEncoded;
                }
                else if (entry.response.content.mimeType.match(/gif/)) {
                    totalGif += sizeEncoded;
                }

                if (entry.request.url.match(preg)) {
                    imagesThird.push(entry);
                    totalImgThird += sizeEncoded;
                }
            }
            else if (entry.response.content.mimeType.match(/script/)) {
                scripts.push(entry);
                totalScript += sizeEncoded;

                if (!entry.request.url.match(preg)) {
                    scriptsThird.push(entry);
                    totalScriptThird += sizeEncoded;
                }
            }
            else if (entry.response.content.mimeType.match(/css/)) {
                styles.push(entry);
                totalStyle += sizeEncoded;

                if (!entry.request.url.match(preg)) {
                    stylesThird.push(entry);
                    totalStyleThird += sizeEncoded;
                }
            }

            if (!entry.request.url.match(preg)) {
                totalThird += sizeEncoded;
                third.push(entry);
            }
        });

        return {
            /*
            // весь лог
            _log: data,

            // время
            time: {

                // ответ сервера
                server: Math.round(data.entries[0].time),

                // готовность документа
                DOMContentLoaded: Math.round(data.pages[0].pageTimings.onContentLoad),

                // загрузка документа
                load: Math.round(data.pages[0].pageTimings.onLoad),

                // окончание загрузки
                finish: Math.round(finish)
            },
*/
            // данные
            data: {

                // всего
                total: {

                    // размер
                    size: total,

                    // размер переданный
                    sizeTransfer: totalTransfer,

                    // запросы
                    entries: data.entries
                },

                // размер документа
                documentSize: this.getEncodedSize(data.entries[0]),

                // стили
                styles: {
                    size: totalStyle,
                    entries: styles
                },

                // скрипты
                scripts: {
                    size: totalScript,
                    entries: scripts
                },

                // изображения
                images: {
                    size: totalImg,
                    entries: images,
                    jpeg: {
                        size: totalJpg,
                        relativeSize: totalJpg / totalImg * 100
                    },
                    png: {
                        size: totalPng,
                        relativeSize: totalPng / totalImg * 100
                    },
                    gif: {
                        size: totalGif,
                        relativeSize: totalGif / totalImg * 100
                    }
                },

                // левейшие ресурсы
                third: {
                    size: totalThird,
                    entries: third,
                    styles: {
                        size: totalStyleThird,
                        entries: stylesThird
                    },
                    scripts: {
                        size: totalScriptThird,
                        entries: scriptsThird
                    },
                    images: {
                        size: totalImgThird,
                        entries: imagesThird
                    }
                }
            }
        };
    },

    getEncodedSize: function(entry)
    {
        if (entry._performanceEntry) {
            return entry.response.bodySize;
        } else {
            for (var i = entry.response.headers.length - 1; i >= 0; i--) {
                if (entry.response.headers[i].name === 'content-length') {
                    return parseInt(entry.response.headers[i].value, 10);
                }
            }
        }
        return entry.response.content.size;
    },

    getTransferSize: function(entry)
    {
        if (entry._performanceEntry) {
            return entry.response._transferSize;
        } else {
            return this.getEncodedSize(entry);
        }
    },





    render: function(parentNode)
    {
        if (!this.parentElem) {
            this.parentElem = parentNode;
        }
        var obj = this.getObjEntry();
        this.element = this.tag.replace({obj: obj}, this.parentElem);

        return this.element;
    }
});

//*************************************************************************************************

return Summary;

//*************************************************************************************************
});
