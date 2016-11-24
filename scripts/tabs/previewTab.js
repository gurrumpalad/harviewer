/* See license.txt for terms of usage */

/**
 * @module tabs/previewTab
 */
define("tabs/previewTab", [
    "domplate/domplate",
    "domplate/tabView",
    "core/lib",
    "i18n!nls/previewTab",
    "domplate/toolbar",
    "tabs/pageTimeline",
    "tabs/harStats",
    "tabs/harSummary",
    "preview/pageList",
    "core/cookies",
    "preview/validationError",
    "core/trace"
],

function(Domplate, TabView, Lib, Strings, Toolbar, Timeline, Stats, Summary, PageList, Cookies,
    ValidationError, Trace) {

var DIV = Domplate.DIV;

//*************************************************************************************************
// Home Tab

function PreviewTab(model)
{
    this.model = model;

    this.toolbar = new Toolbar();
    this.timeline = new Timeline();
    this.stats = new Stats(model, this.timeline);
    this.summary = new Summary(model);

    // Initialize toolbar.
    this.toolbar.addButtons(this.getToolbarButtons());

    // Context menu listener.
    ValidationError.addListener(this);
}

PreviewTab.prototype = Lib.extend(TabView.Tab.prototype,
{
    id: "Preview",
    iterator: 1,
    label: Strings.previewTabLabel,

    // Use tabBodyTag so, the basic content layout is rendered immediately
    // and not as soon as the tab is actually selected. This is useful when
    // new data are appended while the tab hasn't been selected yet.
    tabBodyTag:
        DIV({"class": "tab$tab.id\\Body tabBody", _repObject: "$tab"},
            DIV({"class": "previewToolbar"}),
            DIV({"class": "previewTimeline"}),
            DIV({"class": "previewStats"}),
            DIV({"class": "previewSummary"}),
            DIV({"class": "previewList"})
        ),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab
    setUniqID: function(id)
    {
        this.id = this.id + id;
        this.iterator = id;
    },

    onUpdateBody: function(tabView, body)
    {
        // Render all UI components except of the page list. The page list is rendered
        // as soon as HAR data are loaded into the page.
        this.toolbar.render(Lib.$(body, "previewToolbar"));
        this.stats.render(Lib.$(body, "previewStats"));
        this.timeline.render(Lib.$(body, "previewTimeline"));
        this.summary.render(Lib.$(body, "previewSummary"));

        // Show timeline & stats by default if the cookie says so (no animation)
        // But there should be an input.
        var input = this.model.input;
        if (input && Cookies.getCookie("timeline") === "true")
            this.onTimeline(false);

        if (input && Cookies.getCookie("stats") === "true")
            this.onStats(false);

        if (input && Cookies.getCookie("summary") === "true")
            this.onSummary(false);
    },

    update: function()
    {
        if (this.model && this.model.order) {
            for (var i = 0; i < this.model.order.length; i++) {
                if (this.model.order[i]) {
                    var curInput = this.model.getInputByPageID(this.model.order[i]);
                    if (curInput) {
                        this.append(curInput);
                    }
                }
            }
        }
    },

    getToolbarButtons: function()
    {
        var buttons = [
            {
                id: "showTimeline",
                label: Strings.showTimelineButton,
                tooltiptext: Strings.showTimelineTooltip,
                command: Lib.bindFixed(this.onTimeline, this, true)
            },
            {
                id: "showStats",
                label: Strings.showStatsButton,
                tooltiptext: Strings.showStatsTooltip,
                command: Lib.bindFixed(this.onStats, this, true)
            },
            {
                id: "showSummary",
                label: Strings.showSummaryButton,
                tooltiptext: Strings.showSummaryTooltip,
                command: Lib.bindFixed(this.onSummary, this, true)
            },
            {
                id: "clear",
                label: Strings.clearButton,
                tooltiptext: Strings.clearTooltip,
                command: Lib.bindFixed(this.onClear, this)
            },
            {
                id: "download",
                label: 'Скачать',
                tooltiptext: Strings.downloadTooltip,
                className: "harDownloadButton",
                command: Lib.bindFixed(this.onDownload, this)
            }
        ];

        //buttons.push();

        return buttons;
    },

    onDownload: function()
    {
        var model = this.model;
        if (model.input.log.pages.length > 0) {
            var dataJson = model.toJSON();
            var blob = new Blob([dataJson], {type : 'application/json'});
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = 'netData.har';
            a.click();
            window.URL.revokeObjectURL(url);
            $(a).remove();
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Toolbar commands

    onTimeline: function(animation)
    {
        // Update showTimeline button label.
        var button = this.toolbar.getButton("showTimeline");
        if (!button)
            return;

        this.timeline.toggle(animation);

        var visible = this.timeline.isVisible();
        button.label = Strings[visible ? "hideTimelineButton" : "showTimelineButton"];

        // Re-render toolbar to update label.
        this.toolbar.render();

        Cookies.setCookie("timeline", visible);
    },

    onStats: function(animation)
    {
        // Update showStats button label.
        var button = this.toolbar.getButton("showStats");
        if (!button)
            return;

        this.stats.toggle(animation);

        var visible = this.stats.isVisible();
        button.label = Strings[visible ? "hideStatsButton" : "showStatsButton"];

        // Re-render toolbar to update label.
        this.toolbar.render();

        Cookies.setCookie("stats", visible);
    },

    onSummary: function(animation)
    {

        // Update showStats button label.
        var button = this.toolbar.getButton("showSummary");
        if (!button)
            return;

        this.summary.toggle(animation);

        var visible = this.summary.isVisible();
        button.label = Strings[visible ? "hideSummaryButton" : "showSummaryButton"];

        // Re-render toolbar to update label.
        this.toolbar.render();

        Cookies.setCookie("summary", visible);
    },

    onClear: function()
    {
        Cookies.setCookie("hars" + this.id.substr(7), '');
        var href = document.location.href;
        var index = href.indexOf("?");
        document.location = href.substr(0, index);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Public

    showStats: function(show)
    {
        Cookies.setCookie("stats", show);
    },

    showTimeline: function(show)
    {
        Cookies.setCookie("timeline", show);
    },

    append: function(input)
    {
        // The page list is responsible for rendering expandable list of pages and requests.
        // xxxHonza: There should probable be a list of all pageLists. Inside the pageList?
        var pageList = new PageList(input);
        pageList.append(Lib.$(this._body, "previewList"));

        // Append new pages into the timeline.
        this.timeline.append(input);
        this.summary.append(input);

        // Register context menu listener (provids additional commands for the context menu).
        pageList.addListener(this);
    },

    appendError: function(err)
    {
        ValidationError.appendError(err, Lib.$(this._body, "previewList"));
    },

    addPageTiming: function(timing)
    {
        PageList.prototype.pageTimings.push(timing);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Request List Commands

    getMenuItems: function(items, input, file)
    {
        if (!file)
            return;

        items.push("-");
        items.push(
        {
            label: Strings.menuShowHARSource,
            command: Lib.bind(this.showHARSource, this, input, file)
        });
    },

    showHARSource: function(menu, input, file)
    {
        var domTab = this.tabView.getTab("DOM" + this.iterator);
        if (!domTab)
            return;
        var form = $('.js-ajaxForm[data-tab-id="' + this.iterator + '"]');
        if (form.length > 0) {
            $(form).parent().find('.js-viewToggle.active').removeClass('active');
            $(form).parent().find('.js-viewToggle[data-tab-name="DOM' + this.iterator + '"]').addClass('active');
        }
        domTab.select("DOM" + this.iterator);
        domTab.highlightFile(input, file);
    }
});

//*************************************************************************************************

return PreviewTab;

//*************************************************************************************************
});
