document.addEventListener("DOMContentLoaded", function () {
  const widget_data = window.review_form_widget;
  const form = document.querySelector(
    `.hydrogen_reviews__form.${widget_data.form_id}`
  );
  if (!form) return;
  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(form);
    const submitResponse = await fetch("/apps/hydrogen-reviews", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });
    const submitResponseJson = await submitResponse.json();
    console.log(submitResponseJson);
  }

  form.addEventListener("submit", handleSubmit);
});
