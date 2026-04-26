import{c as r,r as o,j as e}from"./index-CVqzaGab.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=r("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),n={sm:"max-w-md",md:"max-w-lg",lg:"max-w-2xl"},x=({isOpen:s,onClose:t,title:l,children:a,size:d="md"})=>(o.useEffect(()=>(s?document.body.style.overflow="hidden":document.body.style.overflow="unset",()=>{document.body.style.overflow="unset"}),[s]),s?e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center",children:[e.jsx("div",{className:"absolute inset-0 bg-black/50",onClick:t}),e.jsxs("div",{className:`
          relative bg-white rounded-xl shadow-xl w-full mx-4
          ${n[d]}
        `,children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-4 border-b border-slate-200",children:[e.jsx("h2",{className:"text-lg font-semibold text-slate-900",children:l}),e.jsx("button",{onClick:t,className:"p-1 rounded-lg hover:bg-slate-100 transition-colors",children:e.jsx(c,{className:"w-5 h-5 text-slate-500"})})]}),e.jsx("div",{className:"px-6 py-4",children:a})]})]}):null);export{x as M};
