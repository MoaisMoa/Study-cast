/** 앱 전역에 1회 주입할 CSS 문자열 */
export const GLOBAL_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%}
body{
  font-family:'Noto Sans KR','Apple SD Gothic Neo',-apple-system,sans-serif;
  font-size:14px;
  -webkit-font-smoothing:antialiased;
  transition:background 0.25s;
}
a{color:inherit;text-decoration:none}
button{font-family:inherit}

@keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(229,57,53,.28)}60%{box-shadow:0 0 0 8px rgba(229,57,53,0)}}

input[type="date"]::-webkit-calendar-picker-indicator{cursor:pointer;}
[data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.55);}

.live-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:24px 16px;margin-bottom:28px;}
@media(max-width:1100px){.live-grid{grid-template-columns:repeat(4,1fr);}}
@media(max-width:1000px){.live-grid{grid-template-columns:repeat(3,1fr);}}
@media(max-width:768px){.live-grid{grid-template-columns:repeat(2,1fr);gap:16px 12px;}}
@media(max-width:600px){.live-grid{grid-template-columns:repeat(1,1fr);}}
.live-card{border-radius:12px;overflow:hidden;cursor:pointer;transition:box-shadow 0.2s,transform 0.2s;}
.live-card:hover{transform:translateY(-3px);}
.live-card-img{width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease;display:block;}
.live-card:hover .live-card-img{transform:scale(1.04);}

@media(max-width:768px){
  .auth-root{grid-template-columns:1fr !important;}
}
`;
