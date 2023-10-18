/*
TODO:
    - group chat compatibility or disable in group chat
Ideas:

*/

import { saveSettingsDebounced, Generate, event_types, eventSource } from "../../../../script.js";
import { getContext, extension_settings } from "../../../extensions.js";
import { delay } from "../../../utils.js";
export { MODULE_NAME };

const extensionName = "Extension-Enforce-Content";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const MODULE_NAME = 'Enforce';
const DEBUG_PREFIX = "<Enforce extension> ";

let enforcing = "";

//#############################//
//  Extension UI and Settings  //
//#############################//

const defaultSettings = {
    enabled: false,
    expected: "",
    continue_prefix: "",
    max_try: 1
}

function loadSettings() {
    if (extension_settings.enforce === undefined)
        extension_settings.enforce = {};

    if (Object.keys(extension_settings.enforce).length != Object.keys(defaultSettings).length) {
        Object.assign(extension_settings.enforce, defaultSettings)
    }

    $("#enforce_enabled").prop('checked', extension_settings.enforce.enabled);
    $("#enforce_expected").val(extension_settings.enforce.expected);
    $("#enforce_continue_prefix").val(extension_settings.enforce.continue_prefix);
}

async function onEnabledClick() {
    extension_settings.enforce.enabled = $('#enforce_enabled').is(':checked');
    saveSettingsDebounced();
}

async function onExpectedChange() {
    extension_settings.enforce.expected = $('#enforce_expected').val();
    saveSettingsDebounced();
}

async function onContinuePrefixChange() {
    extension_settings.enforce.continue_prefix = $('#enforce_continue_prefix').val();
    saveSettingsDebounced();
}

async function enforceText(chat_id) {
    if (!extension_settings.enforce.enabled)
        return;

    const context = getContext();

    // group mode not compatible
    if (context.groupId != null) {
        console.debug(DEBUG_PREFIX,"Group mode detected, not compatible, abort enforce.");
        //toastr.warning("Not compatible with group mode.", DEBUG_PREFIX + " disabled", { timeOut: 10000, extendedTimeOut: 20000, preventDuplicates: true });
        return;
    }
    
    console.debug(DEBUG_PREFIX, extension_settings.enforce);

    const expected = extension_settings.enforce.expected
    let last_message = getContext().chat[chat_id].mes;
    
    console.debug(DEBUG_PREFIX, "Message received:",last_message);

    if (expected == "") {
        console.debug(DEBUG_PREFIX, "expected is empty, nothing to enforce");
        return;
    }

    if (last_message.includes(expected)) {
        console.debug(DEBUG_PREFIX, "expected text found, nothing to do.");
        return;
    }

    if (enforcing == last_message) {
        console.debug(DEBUG_PREFIX, "Already attempted to enforce, nothing to do");
        enforcing = "";
        return;
    }
    
    console.debug(DEBUG_PREFIX, "expected text not found injecting prefix and calling continue");
    enforcing = last_message + extension_settings.enforce.continue_prefix
    getContext().chat[chat_id].mes = enforcing;
    //$("#option_continue").trigger('click'); // To allow catch by blip extension
    await Generate("continue");
}


//#############################//
//  Extension load             //
//#############################//

// This function is called when the extension is loaded
jQuery(async () => {
    const windowHtml = $(await $.get(`${extensionFolderPath}/window.html`));

    $('#extensions_settings').append(windowHtml);
    loadSettings();

    $("#enforce_enabled").on("click", onEnabledClick);
    $("#enforce_expected").on("change", onExpectedChange);
    $("#enforce_continue_prefix").on("change", onContinuePrefixChange);

    eventSource.on(event_types.MESSAGE_RECEIVED, (chat_id) => enforceText(chat_id));
});
