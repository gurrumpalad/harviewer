/* See license.txt for terms of usage */

/**
 * @module harViewer
 */
define("harViewer", [
    "domplate/tabView",
    "tabs/previewTab",
    "tabs/domTab",
    "preview/harModel",
    "i18n!nls/harViewer",
    "core/lib",
    "core/trace",
    "core/cookies"
],

function(TabView,  PreviewTab, DomTab, HarModel, Strings, Lib, Trace, Cookies) {

var contents = document.getElementsByClassName("js-ajaxTabContent");


// ********************************************************************************************* //
// The Application

function HarView(i)
{
    this.id = "harView";
    this.iterator = i;
    // Location of the model (all tabs see its parent and so the model).
    this.model = new HarModel();
    this.pages = {};
    this.container = null;
}

/**
 * This is the Application UI configuration code. The Viewer UI is based on a Tabbed UI
 * interface and is composed from following tabs:
 *
 * {@link HomeTab}: This is the starting application tab. This tab allows direct inserting of
 *      a HAR log source to preview. There are also some useful links to existing example logs.
 *      This page is displyed by default unless there is a HAR file specified in the URL.
 *      In such case the file is automatically loaded and {@link PreviewTab} selected.
 *
 * {@link PreviewTab}: This tab is used to preview one or more HAR files. The UI is composed
 *      from an expandable list of pages and requests. There is also a graphical timeline
 *      that shows request timings.
 *
 * {@link DomTab}: This tab shows hierarchical structure of the provided HAR file(s) as
 *      an expandable tree.
 *
 * {@link AboutTab}: Shows some basic information about the HAR Viewer and links to other
 *      resources.
 *
 * {@link SchemaTab}: Shows HAR log schema definition, based on JSON Schema.
 */
HarView.prototype = Lib.extend(new TabView(),
/** @lends HarView */
{
    initialize: function(content)
    {
        this.container = content;
        this.removeAllTabs();
        if (this.getTab("Preview" + this.iterator) === undefined) {
            var curTab = new PreviewTab(this.model);
            curTab.setUniqID(this.iterator);
            this.appendTab(curTab);
        }
        if (this.getTab("DOM" + this.iterator) === undefined) {
            var curTab = new DomTab(this.model);
            curTab.setUniqID(this.iterator);
            this.appendTab(curTab);
        }
        // Global application properties.

        this.render(content);

        this.selectTabByName("Preview" + this.iterator);
    },

    removeHarPage: function(pageId)
    {
        if (pageId) {
            this.model.removePageByID(pageId);
            this.update();
        }
    },

    update: function()
    {
        this.initialize(this.container);
        var previewTab = this.getTab("Preview" + this.iterator);
        var domTab = this.getTab("DOM" + this.iterator);
        previewTab.update();
        domTab.update();
    },

    resort: function()
    {
        var form = $('.js-ajaxForm[data-tab-id="' + this.iterator + '"]');
        if (form.length > 0) {
            var fileItems = form.find('.js-fileItems');
            if (fileItems.length > 0) {
                var orderItems = fileItems.find('.js-fileItem');
                this.model.order = [];
                for (var i = 0, ilen = orderItems.length; i < ilen; i++) {
                    var curPageID = $(orderItems[i]).attr('data-page-id').split(',');
                    if (curPageID.length > 0) {
                        this.model.order.push(curPageID);
                    }
                }
            }
        }
        this.update();
    },

    appendPreview: function(jsonString, path)
    {
        var previewTab = this.getTab("Preview" + this.iterator);
        var domTab = this.getTab("DOM" + this.iterator);

        try
        {
            var validate = false; //$("#validate").prop("checked");
            var input = HarModel.parse(jsonString, validate);
            var pageId = this.model.append(input, true, path);

            var form = $('.js-ajaxForm[data-tab-id="' + this.iterator + '"]');
            if (form.length > 0 && path) {
                if (this.pages[path]) {
                    var tempOldPages = this.pages[path];
                    var tempHash = {};
                    for (var i = 0, ilen = tempOldPages.length; i < ilen; i++) {
                        tempHash[tempOldPages[i]] = true;
                    }
                    for (var j = 0, jlen = pageId.length; j < jlen; j++) {
                        tempHash[pageId[j]] = true;
                    }
                    this.pages[path] = [];
                    for (var tmp in tempHash) {
                        this.pages[path].push(tmp);
                    }
                } else {
                    this.pages[path] = pageId;
                }

                var fileItems = form.find('.js-fileItems');

                if (fileItems.length > 0) {
                    fileItems.append('<div class="FileItem js-fileItem" data-page-id="' + pageId.join(',') + '" data-file-path="' + path + '">' + path + '<div class="FileItem__remove js-fileRemove">Удалить</div><div class="FileItem__remove js-fileDrag">&uparrow;&downarrow;</div></div>');
                    var deleteButton = $(fileItems).find('.js-fileRemove:last')[0];
                    if (deleteButton && pageId && pageId.length > 0) {
                        $(deleteButton).bind('click', Lib.bind(function(){
                            this.removeHarPage(pageId);
                            var tmpHash = {};
                            for (var j = 0, jlen = pageId.length; j < jlen; j++) {
                                tmpHash[pageId[j]] = true;
                            }
                            var tmpCurPage = [];
                            for (var i = 0, cilen = this.pages[path].length; i < cilen; i++) {
                                if (!tmpHash[this.pages[path][i]]) {
                                    tmpCurPage.push(this.pages[path][i]);
                                }
                            }
                            if (tmpCurPage.length > 0) {
                                this.pages[path] = tmpCurPage;
                            } else {
                                delete this.pages[path];
                            }
                            var strCookie = JSON.stringify(this.pages);
                            Cookies.setCookie("hars" + this.iterator, strCookie);
                            $(deleteButton).parents('.js-fileItem').remove();
                        }, this));
                    }
                    var tabID = this.iterator;
                    $(fileItems).sortable({
                        items : '.js-fileItem',
                        handle : '.js-fileDrag',
                        helper : 'clone',
                        appendTo: 'body',
                        containment: '.js-ajaxForm',
                        forcePlaceholderSize: true,
                        forceHelperSize: true,
                        scroll: true,
                        scrollSensitivity: 10,
                        scrollSpeed: 10,
                        tolerance: 'pointer',
                        stop: function(event, ui) {
                            var tabObj = $('.js-ajaxTabContent[data-tab-id="' + tabID + '"]').last().get(0).repObject;
                            if (tabObj) {
                                tabObj.resort();
                            }
                        }
                    });
                }
            }

            if (previewTab)
            {
                // xxxHonza: this should be smarter.
                // Make sure the tab is rendered now.
                try
                {
                    previewTab.select();
                    previewTab.append(input);
                }
                catch (err)
                {
                    Trace.exception("HarView.appendPreview; EXCEPTION ", err);
                    if (err.errors && previewTab)
                        previewTab.appendError(err);
                }
            }

            // The input JSON is displayed in the DOM/HAR tab anyway, at least to
            // allow easy inspection of the content.
            // Btw. this makes HAR Viewer an effective JSON Viewer, but only if validation
            // is switched off, otherwise HarModel.parse() throws an exception.
            if (domTab)
                domTab.append(input);

            if (path) {
                var strCookie = JSON.stringify(this.pages);
                Cookies.setCookie("hars" + this.iterator, strCookie);
            }
        }
        catch (err)
        {
            Trace.exception("HarView.appendPreview; EXCEPTION ", err);
            if (err.errors && previewTab)
                previewTab.appendError(err);

            // xxxHonza: display JSON tree even if validation throws an exception
            if (err.input)
                domTab.append(err.input);
        }

        // Select the preview tab in any case.
        previewTab.select();

        Lib.fireEvent(content, "onViewerHARLoaded");
    }
});

// ********************************************************************************************* //
// Initialization
if (contents.length > 0) {
    for (var i = 0, ilen = contents.length; i < ilen; i++) {
        var content = contents.item(i);
        var harView = content.repObject = new HarView(i+1);

        // Fire some events for listeners. This is useful for extending/customizing the viewer.
        Lib.fireEvent(content, "onViewerPreInit");
        harView.initialize(content);
        Lib.fireEvent(content, "onViewerInit");
        //открытие файлов из прошлой сессии
        var tabID = Number(i + 1);
        var harFiles = Cookies.getCookie("hars" + tabID);
        if (harFiles && harFiles.length > 0) {
            try {
                harFiles = JSON.parse(harFiles);
            } catch (e) {
                Cookies.setCookie("hars" + tabID, '');
                Trace.log('Error JSON parse Cookie: ' + e);
            }
        }

        if (harFiles) {
            var harFile = null;
            var tempAr = [];
            for (harFile in harFiles) {
                if (harFiles[harFile].length > 0) {
                    for (var j = 0, jlen = harFiles[harFile].length; j < jlen; j++) {
                        tempAr[harFiles[harFile][j]] = harFile;
                    }
                }
            }
            var form = $('.js-ajaxForm[data-tab-id="' + tabID + '"]');
            var fileItems = form.find('.js-folderContent');
            for (var k = 0, klen = tempAr.length; k < klen; k++) {
                if (tempAr[k] && tempAr[k].length > 0) {
                    var path = tempAr[k];
                    var fileElem = '<div class="File__item js-fileItem" data-remove="Y" data-path="' + path + '"><div class="File__name">' + path + '</div></div>';
                    fileItems.append(fileElem);
                    $(fileItems).find('.js-fileItem:last').get(0).click();
                }
            }
        }
        Trace.log("HarViewer" + i + "; initialized OK");
    }
}

// ********************************************************************************************* //
});
