/* See license.txt for terms of usage */
/* See license.txt for terms of usage */

/**
 * @module preview/harModel
 */
define([
    "core/lib",
    "preview/jsonSchema",
    "preview/ref",
    "preview/harSchema",
    "core/cookies",
    "core/trace",
    "i18n!nls/harModel"
],

function(Lib, JSONSchema, Ref, HarSchema, Cookies, Trace, Strings) {

//*************************************************************************************************
// Statistics

/**
 * @constructor
 * @alias module:preview/harModel
 */
function HarModel()
{
    this.input = null;
    this.order = null;
}

HarModel.prototype =
/** @lends module:preview/harModel.prototype */
{
    append: function(input, needPageId, path)
    {
        var pageIds = [];
        if (!input)
        {
            Trace.error("HarModel.append; Trying to append null input!");
            return;
        }

        // Sort all requests according to the start time.
        input.log.entries.sort(function(a, b)
        {
            var timeA = Lib.parseISO8601(a.startedDateTime);
            var timeB = Lib.parseISO8601(b.startedDateTime);

            if (timeA < timeB)
                return -1;
            else if (timeA > timeB)
                return 1;

            return 0;
        });

        if (this.input)
        {
            if (input.log.pages)
            {
                for (var i = 0, ilen = input.log.pages.length; i < ilen; i++)
                    pageIds.push(this.importPage(input.log.pages[i], input.log.entries));
            }
            else
            {
                Trace.error("Import of additional data without a page is not yet supported.");
                //xxxHonza: how to properly import data with no page?
                //for (var i=0; i<input.log.entries.length; i++)
                //    this.input.log.entries.push(input.log.entries[i]);
                return null;
            }
        }
        else
        {
            this.input = Lib.cloneJSON(input);
            for (var i = 0, ilen = this.input.log.pages.length; i < ilen; i++)
                pageIds.push(this.input.log.pages[i].id);
        }


        if (path) {
            if (this.order) {
                this.order.push(pageIds);
            } else {
                this.order = [];
                this.order.push(pageIds);
            }
        }
        if (needPageId) {
            return pageIds;
        } else {
            return this.input;
        }
    },

    removePageByID: function(pageID)
    {
        if (pageID && this.input.log.pages) {
            var tempPages = this.input.log.pages;
            this.input.log.pages = [];
            for (var m = 0, len = tempPages.length; m < len; m++) {
                if (tempPages[m] && tempPages[m].id && tempPages[m].id != pageID) {
                    this.input.log.pages.push(tempPages[m]);
                }
            }
            if (this.input.log.entries) {
                var tempEntry = [];
                for (var j = 0, entLen = this.input.log.entries.length; j < entLen; j++) {
                    if (this.input.log.entries[j].pageref != pageID) {
                        tempEntry.push(this.input.log.entries[j]);
                    }
                }
                this.input.log.entries = tempEntry;
            }
            if (this.order) {
                var tempArOrder = [];
                for (var i = 0, olen = this.order.length; i < olen; i++) {
                    if (this.order[i]) {
                        var tempOrder = [];
                        for (var k = 0, llen = this.order[i].length; k < llen; k++) {
                            if (this.order[i][k] && this.order[i][k] != pageID) {
                                tempOrder.push(this.order[i][k]);
                            }
                        }
                        if (tempOrder.length > 0) {
                            tempArOrder.push(tempOrder);
                        }
                    }
                }
                if (tempArOrder.length > 0) {
                    this.order = tempArOrder;
                } else {
                    this.order = null;
                }
            }
        }
    },

    getInputByPageID: function(arPageID)
    {
        if (arPageID && arPageID.length > 0 && this.input.log.pages) {
            var tempInput = {};
            if (this.input.creator) {
                tempInput.creator = this.input.creator;
            }
            if (this.input.version) {
                tempInput.version = this.input.version;
            }
            if (this.input._duration) {
                tempInput._duration = this.input._duration;
            }
            tempInput.log = {};
            tempInput.log.pages = [];
            tempInput.log.entries = [];
            for (var i = 0, plen = arPageID.length; i < plen; i++) {
                if (arPageID[i] && this.input.log.pages) {
                    for (var k = 0, iplen = this.input.log.pages.length; k < iplen; k++) {
                        if (this.input.log.pages[k] && this.input.log.pages[k].id && this.input.log.pages[k].id == arPageID[i]) {
                            tempInput.log.pages.push(this.input.log.pages[k]);
                            var curPageID = arPageID[i];
                            for (var j = 0, ipelen = this.input.log.entries.length; j < ipelen; j++) {
                                if (this.input.log.entries[j].pageref == curPageID) {
                                    tempInput.log.entries.push(this.input.log.entries[j]);
                                }
                            }
                        }
                    }
                }
            }
            return tempInput;
        }
        return null;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Pages

    /**
     * @return {Array} An array of page objects.
     */
    getPages: function()
    {
        if (!this.input)
            return [];

        var tempPages = [];
        if (this.order) {
            var tempArOrder = [];
            for (var i = 0, ilen = this.order.length; i < ilen; i++) {
                if (this.order[i]) {
                    for (var k = 0, klen = this.order[i].length; k < klen; k++) {
                        tempArOrder.push(this.order[i][k]);
                    }
                }
            }
            for (var j = 0, jlen = tempArOrder.length; j < jlen; j++) {
                for (var m = 0, mlen = this.input.log.pages.length; m < mlen; m++) {
                    if (this.input.log.pages[m] && this.input.log.pages[m].id && this.input.log.pages[m].id == tempArOrder[j]) {
                        tempPages.push(this.input.log.pages[m]);
                    }
                }
            }
        }
        if (tempPages.length > 0) {
            return tempPages;
        }

        return this.input.log.pages ? this.input.log.pages : [];
    },

    /**
     * @return {Page} The first page if it exists, else null.
     */
    getFirstPage: function()
    {
        var pages = this.getPages();
        return pages.length > 0 ? pages[0] : null;
    },

    /**
     * @see {@link module:preview/harModel.getPageEntries}
     */
    getPageEntries: function(page)
    {
        return HarModel.getPageEntries(this.input, page);
    },

    getAllEntries: function(page)
    {
        return this.input ? this.input.log.entries : [];
    },

    getParentPage: function(file)
    {
        return HarModel.getParentPage(this.input, file);
    },

    importPage: function(page, entries)
    {
        var pageId = this.getUniquePageID(page.id);
        var prevPageId = page.id;
        page.id = pageId;

        this.input.log.pages.push(page);
        for (var i= 0, ilen = entries.length; i < ilen; i++)
        {
            var entry = entries[i];
            if (entry.pageref === prevPageId)
            {
                entry.pageref = pageId;
                this.input.log.entries.push(entry);
            }
        }
        return pageId;
    },

    getUniquePageID: function(defaultId)
    {
        var pages = this.input.log.pages;
        var hashTable = {};
        for (var i=0; i<pages.length; i++)
            hashTable[pages[i].id] = true;

        if (!hashTable[defaultId])
            return defaultId;

        var counter = 1;
        while (true)
        {
            var pageId = Number(defaultId + counter);
            if (!hashTable[pageId])
                return pageId;
            counter++;
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // JSON

    toJSON : function(input)
    {
        if (!input)
            input = this.input;

        if (!input)
            return "";

        // xxxHonza: we don't have to iterate all entries again if it did already.
        var entries = this.input.log.entries;
        for (var i=0; i<entries.length; i++) {
            var entry = entries[i];
            if (entry.response.content.text)
                entry.response.content.toJSON = contentToUnicode;
        }

        var jsonString = JSON.stringify(this.input, null, "\t");
        var result = jsonString.replace(/\\\\u/g, "\\u");
        return result;
    }
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
// Static methods (no instance of the model, no |this| )

HarModel.parse = function(jsonString, validate)
{
    var input = jsonString;

    try
    {
        if (typeof(jsonString) === "string")
            input = jQuery.parseJSON(jsonString);
    }
    catch (err)
    {
        Trace.exception("HarModel.parse; EXCEPTION", err);

        throw {
            errors: [{
                "message": "Failed to parse JSON",
                "property": "JSON evaluation"
            }]
        };
    }

    if (!validate)
        return input;

    //xxxHonza: the schema doesn't have to be resolved repeatedly.
    var resolvedSchema = Ref.resolveJson(HarSchema);
    var result = JSONSchema.validate(input, resolvedSchema.logType);
    if (result.valid)
    {
        this.validateRequestTimings(input);
        return input;
    }

    throw result;
};

// xxxHonza: optimalization using a map?
/**
 * If `page` is not provided, then return all the HAR entries without a parent `Page`.
 * If `page` is provided, then return all the HAR entries whose `pageref` matches `page.id`.
 * @param {HAR} input The input HAR object.
 * @param {Page} page The `Page` object to use to search for entries.
 * @return {Array} The `Page` entries.
 */
HarModel.getPageEntries = function(input, page)
{
    var result = [];

    var entries = input.log.entries;
    if (!entries)
        return result;

    for (var i=0; i<entries.length; i++)
    {
        var entry = entries[i];

        // Return all requests that doesn't have a parent page.
        if (!entry.pageref && !page)
            result.push(entry);

        // Return all requests for the specified page.
        if (page && entry.pageref === page.id)
            result.push(entry);
    }

    return result;
};

// xxxHonza: optimize using a map?
/**
 * @param {HAR} input The input HAR object.
 * @param {Entry} file The `Entry` object to use to find the parent `Page`.
 * @return {Page} The parent `Page` of the file/`Entry`, or null if a parent `Page` could not be
 *     found.
 */
HarModel.getParentPage = function(input, file)
{
    var pages = input.log.pages;
    if (!pages)
        return null;

    for (var i=0; i<pages.length; i++)
    {
        if (pages[i].id === file.pageref)
            return pages[i];
    }

    return null;
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
// Validation

HarModel.validateRequestTimings = function(input)
{
    var errors = [];

    // Iterate all request timings and check the total time.
    var entries = input.log.entries;
    for (var i=0; i<entries.length; i++)
    {
        var entry = entries[i];
        var timings = entry.timings;

        /* http://code.google.com/p/chromium/issues/detail?id=339551
        var total = 0;
        for (var p in timings)
        {
            var time = parseInt(timings[p], 10);

            // According to the spec, the ssl time is alrady included in "connect".
            if (p != "ssl" && time > 0)
                total += time;
        }

        if (total != entry.time)
        {
            var message = Lib.formatString(Strings.validationSumTimeError,
                entry.request.url, entry.time, total, i, entry.pageref);

            errors.push({
                input: input,
                file: entry,
                "message": message,
                "property": Strings.validationType
            });
        }*/

        if (timings.blocked < -1 ||
            timings.connect < -1 ||
            timings.dns < -1 ||
            timings.receive < -1 ||
            timings.send < -1 ||
            timings.wait < -1)
        {
            var message = Lib.formatString(Strings.validationNegativeTimeError,
                entry.request.url, i, entry.pageref);

            errors.push({
                input: input,
                file: entry,
                "message": message,
                "property": Strings.validationType
            });
        }
    }

    if (errors.length)
        throw {errors: errors, input: input};
};

HarModel.isCachedEntry = function(entry) {
    var response = entry.response;
    var resBodySize = Math.max(0, response.bodySize);
    return (response.status === 304 || (resBodySize === 0 && response.content && response.content.size > 0));
};

HarModel.getEntrySize = function(entry) {
    var bodySize = entry.response.bodySize;
    return (bodySize && bodySize !== -1) ? bodySize : entry.response.content.size;
};

HarModel.getEntryUncompressedSize = function(entry) {
    return Math.max(0, entry.response.content.size) || Math.max(0, entry.response.bodySize);
};

HarModel.getEntryTransferredSize = function(entry) {
    return (entry.response.status === 304) ? 0 : Math.max(0, entry.response.bodySize);
};

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

// Make sure the response (it can be binary) is converted to Unicode.
function contentToUnicode()
{
    var newContent = {};
    for (var prop in this) {
        if (prop !== "toJSON")
            newContent[prop] = this[prop];
    }

    if (!this.text)
        return newContent;

    newContent.text = Array.prototype.map.call(this.text, function(x) {
        var charCode = x.charCodeAt(0);
        if ((charCode >= 0x20 && charCode < 0x7F) ||
             charCode === 0xA || charCode === 0xD)
            return x.charAt(0);

        var unicode = charCode.toString(16).toUpperCase();
        while (unicode.length < 4)
            unicode = "0" + unicode;
        return "\\u" + unicode;
    }).join("");

    return newContent;
}

return HarModel;

//*************************************************************************************************
});
