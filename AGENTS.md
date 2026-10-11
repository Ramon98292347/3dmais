<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep catalog domain types, mock data and replaceable catalog/checkout service interfaces independent of presentation; future integrations must not require changing UI components.
- Keep cart state in the shared CartProvider and validate persisted entries against the current product source; the frontend-only stage must survive refresh without a backend.
- Use nested catalog routes with a layout Outlet and a product slug leaf; redirect the root to the catalog to keep the initial experience usable.
- Keep contact configuration centralized and do not invent contact details when none were supplied.
