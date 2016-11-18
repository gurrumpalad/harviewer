/* See license.txt for terms of usage */

/**
 * @module harViewer
 */
define("harViewer", [
    "domplate/tabView",
    "tabs/previewTab",
    "tabs/domTab",
    "preview/harModel",
    "preview/harModelLoader",
    "i18n!nls/harViewer",
    "preview/requestList",
    "core/lib",
    "core/trace",
    "core/cookies"
],

function(TabView,  PreviewTab, DomTab, HarModel,
    Loader, Strings, RequestList, Lib, Trace, Cookies) {

var contents = document.getElementsByClassName("js-ajaxTabContent");//.item(document.getElementsByClassName("js-ajaxTabContent").length - 1);

//document.getElementById("content");

// ********************************************************************************************* //
// The Application

function HarView(i)
{
    this.id = "harView";
    this.iterator = i;
    // Location of the model (all tabs see its parent and so the model).
    this.model = new HarModel();

    // Append tabs
    //this.appendTab(new HomeTab());

    //this.appendTab(new PreviewTab(this.model));

    //this.appendTab(new AboutTab());
    //this.appendTab(new SchemaTab());
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
    initialize: function(content, inputHar)
    {
        this.removeAllTabs();
        if (this.getTab("Preview" + this.iterator) === undefined) {
            var curTab = new PreviewTab(this.model);
            curTab.setUniqID(this.iterator);
            this.appendTab(curTab);
        }
        if (this.getTab("DOM" + this.iterator) === undefined) {
            var curTab = new DomTab();
            curTab.setUniqID(this.iterator);
            this.appendTab(curTab);
        }
        // Global application properties.

        this.render(content);

        this.selectTabByName("Preview" + this.iterator);

        if (inputHar) {
            this.appendPreview(inputHar);
        }
    },

    appendPreview: function(jsonString, path)
    {
        //var homeTab = this.getTab("Home");
        var previewTab = this.getTab("Preview" + this.iterator);
        var domTab = this.getTab("DOM" + this.iterator);

        try
        {
            var validate = false; //$("#validate").prop("checked");
            var input = HarModel.parse(jsonString, validate);
            this.model.append(input);

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
                var strCookie = Cookies.getCookie("hars" + this.iterator);
                if (strCookie && strCookie.length > 0 && strCookie.indexOf(path) < 0) {
                    strCookie += "#" + path;
                } else {
                    strCookie = path;
                }
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

        // HAR loaded, parsed and appended into the UI, let's shut down the progress.
        /*if (homeTab)
            homeTab.loadInProgress(false);*/

        Lib.fireEvent(content, "onViewerHARLoaded");
    },

    removeHarFile: function(jsonString, path)
    {
        try
        {

            var validate = false;
            var input = HarModel.parse(jsonString, validate);
            input = this.model.removeHar(input);
            this.model.input = input;
            input = this.model.toJSON(input);
            this.model.input = null;
            if (path) {
                var strCookie = Cookies.getCookie("hars" + this.iterator);
                if (strCookie && strCookie.length > 0) {
                    var arCookie = strCookie.split('#');
                    var arNewCookie = [];
                    strCookie = '';
                    for (var i = 0; i < arCookie.length; i++) {
                        if (arCookie[i] && arCookie[i] != path) {
                            arNewCookie.push(arCookie[i]);
                        }
                    }
                    strCookie = arNewCookie.join('#');
                }
                Cookies.setCookie("hars" + this.iterator, strCookie);
            }

            return input;
        }
        catch (err)
        {
            Trace.exception("HarView.appendPreview; EXCEPTION ", err);
        }
    },

    onLoadError: function(jqXHR, textStatus, errorThrown)
    {
        /*var homeTab = this.getTab("Home");
        if (homeTab)
            homeTab.loadInProgress(true, jqXHR.statusText);*/

        Trace.error("harModule.loadRemoteArchive; ERROR ", jqXHR, textStatus, errorThrown);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Loading HAR files

    /**
     * Load HAR file
     * @param {String} url URL of the target log file
     * @param {Object} settings A set of key/value pairs taht configure the request.
     *      All settings are optional.
     *      settings.jsonp {Boolean} If you wish to force a crossDomain request using JSONP,
     *          set the value to true. You need to use HARP syntax for the target file.
     *          Default is false.
     *      settings.jsonpCallback {String} Override the callback function name used in HARP.
     *          Default is "onInputData".
     *      settings.success {Function} A function to be called when the file is successfully
     *          loaded. The HAR object is passed as an argument.
     *      settings.ajaxError {Function} A function to be called if the AJAX request fails.
     *          An error object is pased as an argument.
     */
    loadHar: function(url, settings)
    {
        settings = settings || {};
        return Loader.load(this, url,
            settings.jsonp,
            settings.jsonpCallback,
            settings.success,
            settings.ajaxError);
    },

    /**
     * Load HAR and HARP file. See {@link harModelLoader.loadArchives} for documentation.
     */
    loadArchives: function(hars, harps, callbackName, callback, errorCallback, doneCallback) {
        var self = this;
        return Loader.loadArchives(hars, harps, callbackName, function(jsonString) {
            self.appendPreview(jsonString);
            if (callback) {
                callback.apply(this, arguments);
            }
        }, errorCallback, doneCallback);
    },

    /**
     * Use to customize list of request columns displayed by default.
     *
     * @param {String} cols Column names separated by a space.
     * @param {Boolean} avoidCookies Set to true if you don't want to touch cookies.
     */
    setPreviewColumns: function(cols, avoidCookies)
    {
        RequestList.setVisibleColumns(cols, avoidCookies);
    }
});

// ********************************************************************************************* //
// Initialization
if (contents.length > 0) {
    for (var i = 0; i < contents.length; i++) {
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
            harFiles = harFiles.split('#');
            for (var j = 0; j < harFiles.length; j++) {
                if (harFiles[j]) {
                    var form = $('.js-ajaxForm[data-tab-id="' + tabID + '"]');
                    var path = harFiles[j];
                    var fileItems = form.find('.js-folderContent');
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
