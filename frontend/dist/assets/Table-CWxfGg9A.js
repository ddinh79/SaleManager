import{c as i,r as x,j as e}from"./index-BLP2iK9u.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=i("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]),n=x.forwardRef(({label:a,error:l,options:r,className:d="",...s},c)=>e.jsxs("div",{className:"flex flex-col gap-1",children:[a&&e.jsx("label",{className:"text-sm font-medium text-slate-700",children:a}),e.jsx("select",{ref:c,className:`
            px-3 py-2 rounded-lg border transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${l?"border-red-500":"border-slate-300"}
            ${d}
          `,...s,children:r.map(t=>e.jsx("option",{value:t.value,children:t.label},t.value))}),l&&e.jsx("span",{className:"text-sm text-red-500",children:l})]}));n.displayName="Select";function m({columns:a,data:l,onRowClick:r,emptyMessage:d="No data available"}){return e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"min-w-full divide-y divide-slate-200",children:[e.jsx("thead",{className:"bg-slate-50",children:e.jsx("tr",{children:a.map(s=>e.jsx("th",{className:"px-4 py-3 text-left text-sm font-semibold text-slate-700",children:s.header},String(s.key)))})}),e.jsx("tbody",{className:"bg-white divide-y divide-slate-200",children:l.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:a.length,className:"px-4 py-12 text-center text-slate-500",children:d})}):l.map((s,c)=>e.jsx("tr",{onClick:()=>r==null?void 0:r(s),className:r?"cursor-pointer hover:bg-slate-50":"",children:a.map(t=>e.jsx("td",{className:"px-4 py-3 text-sm text-slate-700",children:t.render?t.render(s):String(s[t.key]??"")},String(t.key)))},s.id??c))})]})})}export{p as P,n as S,m as T};
