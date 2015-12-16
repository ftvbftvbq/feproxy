(function() {
window["Tmpl"] = window["Tmpl"] || {};

window["Tmpl"]["index_advance_row"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<tr class="advance-item">\n    <td>\n        <input class="enable" type="checkbox"\n            ' +
((__t = ( obj.enable ? ' checked="checked" ' : '' )) == null ? '' : __t) +
'/>\n    </td>\n    <td>\n        <input class="match" type="text" \n            value="' +
((__t = ( obj.match || '' )) == null ? '' : __t) +
'" />\n    </td>\n    <td>\n        <input class="target" type="text" \n            value="' +
((__t = ( obj.target || '' )) == null ? '' : __t) +
'" />\n    </td>\n    <td>\n        <input class="ip" type="text" \n            value="' +
((__t = ( obj.ip || '' )) == null ? '' : __t) +
'" />\n    </td>\n    <td>\n        <button class="ui-button delete-row" type="button">Delete</button>\n    </td>\n</tr>\n';

}
return __p
}})();(function() {
window["Tmpl"] = window["Tmpl"] || {};

window["Tmpl"]["index_host_row"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<tr class="host-item">\n    <td>\n        <input class="enable" type="checkbox"\n            ' +
((__t = ( obj.enable ? ' checked="checked" ' : '' )) == null ? '' : __t) +
'/>\n    </td>\n    <td>\n        <input class="ip" type="text" value="' +
((__t = ( obj.ip || '' )) == null ? '' : __t) +
'" />\n    </td>\n    <td>\n        <input class="host" type="text" value="' +
((__t = ( obj.host || '' )) == null ? '' : __t) +
'" />\n    </td>\n    <td>\n        <button class="ui-button delete-row" type="button">Delete</button>\n    </td>\n</tr>\n';

}
return __p
}})();(function() {
window["Tmpl"] = window["Tmpl"] || {};

window["Tmpl"]["index_project"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="project-item ' +
((__t = ( obj.isNew ? '' : 'folded' )) == null ? '' : __t) +
'">\n    <div class="project-header">\n        <i class="project-fold-toggle"></i>\n        <input class="project-enable" type="checkbox" \n            ' +
((__t = ( obj.enable ? ' checked="checked" ' : '' )) == null ? '' : __t) +
'/>\n        <input class="project-name" type="text" \n            value="' +
((__t = ( obj.name || '' )) == null ? '' : __t) +
'" />\n    </div>\n    <div class="project-action">\n        <button class="ui-button delete-project" type="button">Delete</button>\n    </div>\n    <div class="project-setting">\n        <div class="tab-anchor-list">\n            <div class="tab-anchor active" data-tab="rule">Rule</div>\n            <div class="tab-anchor" data-tab="host">Host</div>\n            <div class="tab-anchor" data-tab="advance">Advance</div>\n        </div>\n        <div class="tab-list">\n            <div class="tab active" data-tab="rule">\n                <table class="rule-table" width="100%">\n                    <tr>\n                        <th width="40">Enable</th>\n                        <th>Match</th>\n                        <th>Target</th>\n                        <th width="100">\n                            <button class="ui-button add-rule" type="button">Add</button>\n                        </th>\n                    </tr>\n                </table>\n            </div>\n            <div class="tab" data-tab="host">\n                <table class="host-table" width="100%">\n                    <tr>\n                        <th width="40">Enable</th>\n                        <th>IP</th>\n                        <th>Host</th>\n                        <th width="100">\n                            <button class="ui-button add-host" type="button">Add</button>\n                        </th>\n                    </tr>\n                </table>\n            </div>\n            <div class="tab" data-tab="advance">\n                <table class="advance-table" width="100%">\n                    <tr>\n                        <th width="40">Enable</th>\n                        <th>Match</th>\n                        <th>Target</th>\n                        <th>IP</th>\n                        <th width="100">\n                            <button class="ui-button add-advance" type="button">Add</button>\n                        </th>\n                    </tr>\n                </table>\n            </div>\n        </div>\n    </div>\n</div>\n';

}
return __p
}})();(function() {
window["Tmpl"] = window["Tmpl"] || {};

window["Tmpl"]["index_rule_row"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<tr class="rule-item">\n    <td>\n        <input class="enable" type="checkbox"\n            ' +
((__t = ( obj.enable ? ' checked="checked" ' : '' )) == null ? '' : __t) +
'/>\n    </td>\n    <td>\n        <input class="match" type="text" \n            value="' +
((__t = ( obj.match || '' )) == null ? '' : __t) +
'" />\n    </td>\n    <td>\n        <input class="target" type="text" \n            value="' +
((__t = ( obj.target || '' )) == null ? '' : __t) +
'" />\n    </td>\n    <td>\n        <button class="ui-button delete-row" type="button">Delete</button>\n    </td>\n</tr>\n';

}
return __p
}})();