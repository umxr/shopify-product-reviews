document.addEventListener("DOMContentLoaded", function () {
  const widget_data = window.review_form_widget;
  const form = document.querySelector(
    `.hydrogen_reviews__form.${widget_data.form_id}`
  );
  const success_message = document.querySelector(
    ".hydrogen_reviews__form-status--success"
  );
  const error_message = document.querySelector(
    ".hydrogen_reviews__form-status--error"
  );
  if (!form) return;
  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = {
      productId: widget_data.product_id,
      name: formData.get("name"),
      rating: formData.get("rating"),
      message: formData.get("message"),
    };
    const submitResponse = await fetch("/apps/hydrogen-reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const submitResponseJson = await submitResponse.json();
    // Handle Response
    const { status } = submitResponseJson;
    if (status === "sucess") {
      form.reset();
      success_message.display = "block";
      error_message.display = "none";
    } else {
      success_message.display = "none";
      error_message.display = "block";
    }
  }

  form.addEventListener("submit", handleSubmit);
});
