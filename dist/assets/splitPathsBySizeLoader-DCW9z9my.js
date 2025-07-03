import { _ as __awaiter, a as __generator, b as __vitePreload, p as pascalCase, c as IconSize } from "./index-BwhyB4nb.js";
var splitPathsBySizeLoader = function(name, size) {
  return __awaiter(void 0, void 0, void 0, function() {
    var key, pathsRecord;
    return __generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          key = pascalCase(name);
          if (!(size === IconSize.STANDARD)) return [3, 2];
          return [4, __vitePreload(() => import(
            /* webpackChunkName: "blueprint-icons-16px-paths" */
            "./index-BV5xmvTQ.js"
          ).then((n) => n.I), true ? [] : void 0)];
        case 1:
          pathsRecord = _a.sent();
          return [3, 4];
        case 2:
          return [4, __vitePreload(() => import(
            /* webpackChunkName: "blueprint-icons-20px-paths" */
            "./index-CeUBAFWF.js"
          ).then((n) => n.I), true ? [] : void 0)];
        case 3:
          pathsRecord = _a.sent();
          _a.label = 4;
        case 4:
          return [2, pathsRecord[key]];
      }
    });
  });
};
export {
  splitPathsBySizeLoader
};
//# sourceMappingURL=splitPathsBySizeLoader-DCW9z9my.js.map
