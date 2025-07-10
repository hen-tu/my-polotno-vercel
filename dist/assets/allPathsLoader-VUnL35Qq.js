const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/allPaths-DN5dVI4A.js","assets/index-BV5xmvTQ.js","assets/index-CeUBAFWF.js","assets/index-D1SUMljt.js","assets/index-DpHVQKPa.css"])))=>i.map(i=>d[i]);
import { _ as __awaiter, a as __generator, b as __vitePreload } from "./index-D1SUMljt.js";
var allPathsLoader = function(name, size) {
  return __awaiter(void 0, void 0, void 0, function() {
    var getIconPaths;
    return __generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          return [4, __vitePreload(() => import(
            /* webpackChunkName: "blueprint-icons-all-paths" */
            "./allPaths-DN5dVI4A.js"
          ), true ? __vite__mapDeps([0,1,2,3,4]) : void 0)];
        case 1:
          getIconPaths = _a.sent().getIconPaths;
          return [2, getIconPaths(name, size)];
      }
    });
  });
};
export {
  allPathsLoader
};
//# sourceMappingURL=allPathsLoader-VUnL35Qq.js.map
