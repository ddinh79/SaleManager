import{r as d,j as e}from"./index-BIBqXrFq.js";const n=d.forwardRef(({label:r,error:s,options:a,className:t="",...c},o)=>e.jsxs("div",{className:"flex flex-col gap-1",children:[r&&e.jsx("label",{className:"text-sm font-medium text-slate-700",children:r}),e.jsx("select",{ref:o,className:`
            px-3 py-2 rounded-lg border transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${s?"border-red-500":"border-slate-300"}
            ${t}
          `,...c,children:a.map(l=>e.jsx("option",{value:l.value,children:l.label},l.value))}),s&&e.jsx("span",{className:"text-sm text-red-500",children:s})]}));n.displayName="Select";export{n as S};
