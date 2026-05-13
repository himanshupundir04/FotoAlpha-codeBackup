import Swal from "sweetalert2";

/**
 * Generic modern confirmation dialog.
 *
 * @param {object} opts
 * @param {string} opts.title        - Bold heading shown in the modal
 * @param {string} opts.description  - Supporting text below the heading
 * @param {string} [opts.confirmText="Confirm"]   - Label for the primary action button
 * @param {string} [opts.cancelText="Go back"]    - Label for the dismiss button
 * @param {"danger"|"success"} [opts.variant="danger"] - Controls icon and button colour
 * @returns {Promise<import("sweetalert2").SweetAlertResult>}
 */
export const showConfirmDialog = ({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Go back",
  variant = "danger",
}) => {
  const isDanger = variant === "danger";
  const accentColor = isDanger ? "#ef4444" : "#16a34a";
  const iconBg = isDanger ? "#fef2f2" : "#f0fdf4";
  const svgPath = isDanger
    ? `<circle cx="12" cy="12" r="9" stroke="${accentColor}" stroke-width="2.2"/>
       <path d="M15 9L9 15M9 9L15 15" stroke="${accentColor}" stroke-width="2.2" stroke-linecap="round"/>`
    : `<path d="M20 6L9 17L4 12" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  return Swal.fire({
    html: `
      <div style="text-align:center;padding:8px 0 4px">
        <div style="
          width:60px;height:60px;border-radius:50%;background:${iconBg};
          display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            ${svgPath}
          </svg>
        </div>
        <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:10px;font-family:inherit;line-height:1.3">
          ${title}
        </div>
        <div style="font-size:14px;color:#64748b;line-height:1.65;font-family:inherit">
          ${description}
        </div>
      </div>
    `,
    showCancelButton: true,
    buttonsStyling: false,
    reverseButtons: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    width: 400,
    padding: "28px 32px 32px",
    backdrop: "rgba(15,23,42,0.45)",
    didOpen: () => {
      const popup = Swal.getPopup();
      popup.style.borderRadius = "16px";
      popup.style.boxShadow = "0 24px 64px rgba(0,0,0,0.18)";

      const base =
        "border:none;border-radius:8px;font-weight:600;font-size:14px;" +
        "cursor:pointer;padding:10px 24px;font-family:inherit;";

      const confirmBtn = Swal.getConfirmButton();
      const cancelBtn = Swal.getCancelButton();
      const actions = Swal.getActions();

      confirmBtn.style.cssText = base + `background:${accentColor};color:#fff;`;
      cancelBtn.style.cssText = base + "background:#f1f5f9;color:#475569;";

      if (actions) {
        actions.style.cssText =
          "display:flex;gap:10px;margin-top:24px;justify-content:center;";
      }

      confirmBtn.onmouseenter = () => { confirmBtn.style.opacity = "0.88"; };
      confirmBtn.onmouseleave = () => { confirmBtn.style.opacity = "1"; };
      cancelBtn.onmouseenter = () => { cancelBtn.style.background = "#e2e8f0"; };
      cancelBtn.onmouseleave = () => { cancelBtn.style.background = "#f1f5f9"; };
    },
  });
};
