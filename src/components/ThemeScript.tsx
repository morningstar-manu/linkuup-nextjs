/**
 * Script execute avant le premier paint pour eviter le flash de theme incorrect.
 * Respecte la preference systeme par defaut.
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){
          var s=localStorage.getItem('linkuup-theme');
          var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
          var dark=s==='dark'||(s!=='light'&&prefersDark);
          document.documentElement.classList.toggle('dark',dark);
        })();`,
      }}
    />
  );
}
