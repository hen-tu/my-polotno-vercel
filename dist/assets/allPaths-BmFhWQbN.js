import { I as IconSvgPaths16 } from "./index-BV5xmvTQ.js";
import { I as IconSvgPaths20 } from "./index-CeUBAFWF.js";
import { p as pascalCase, c as IconSize } from "./index-BwhyB4nb.js";
function getIconPaths(name, size) {
  var key = pascalCase(name);
  return size === IconSize.STANDARD ? IconSvgPaths16[key] : IconSvgPaths20[key];
}
function iconNameToPathsRecordKey(name) {
  return pascalCase(name);
}
export {
  IconSvgPaths16,
  IconSvgPaths20,
  getIconPaths,
  iconNameToPathsRecordKey
};
//# sourceMappingURL=allPaths-BmFhWQbN.js.map
