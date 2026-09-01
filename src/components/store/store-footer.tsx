export function StoreFooter() {
  return (
    <footer className="bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6 mt-6 border-t border-zinc-800 pt-6 text-center text-xs text-orange-500">
        © {new Date().getFullYear()} Desenvolvido por{" "}
        <a href="https://www.instagram.com/fernaando.alves/" target="_blank">
          @fernandoalvess
        </a>. Todos os direitos reservados.
      </div>
    </footer>
  );
}
