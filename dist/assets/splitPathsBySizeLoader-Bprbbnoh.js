const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-BwhyB4nb.js","assets/index-gOTW-y7E.css"])))=>i.map(i=>d[i]);
import { _ as __awaiter, a as __generator, b as __vitePreload, p as pascalCase, I as IconSize } from "./index-BwhyB4nb.js";
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
            "./index-BwhyB4nb.js"
          ).then((n) => n.d), true ? __vite__mapDeps([0,1]) : void 0)];
        case 1:
          pathsRecord = _a.sent();
          return [3, 4];
        case 2:
          return [4, __vitePreload(() => import(
            /* webpackChunkName: "blueprint-icons-20px-paths" */
            "./index-BwhyB4nb.js"
          ).then((n) => n.e), true ? __vite__mapDeps([0,1]) : void 0)];
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
//# sourceMappingURL=splitPathsBySizeLoader-Bprbbnoh.js.map
