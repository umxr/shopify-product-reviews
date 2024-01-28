document.addEventListener("DOMContentLoaded", function () {
  const widget_data = window.review_form_widget;
  const form = document.querySelector(
    `.hydrogen_reviews__form.${widget_data.form_id}`
  );
  if (!form) return;
  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(form);
    formData.append("reviews", JSON.stringify(widget_data.product_reviews));
    const submitResponse = await fetch("/apps/hydrogen-reviews", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });
    const submitResponseJson = await submitResponse.json();
    // Handle Response
    console.log(submitResponseJson);
  }

  form.addEventListener("submit", handleSubmit);
});
