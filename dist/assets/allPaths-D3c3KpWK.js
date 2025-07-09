import { I as IconSvgPaths16 } from "./index-BV5xmvTQ.js";
import { I as IconSvgPaths20 } from "./index-CeUBAFWF.js";
import { p as pascalCase, I as IconSize } from "./index-CcSFbBeF.js";
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
//# sourceMappingURL=allPaths-D3c3KpWK.js.map
