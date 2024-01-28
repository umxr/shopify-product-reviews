document.addEventListener("DOMContentLoaded", function () {
  const widget_data = window.inline_stars_widget;
  const product_reviews = widget_data.product_reviews;
  const widget_id = widget_data.widget_id;
  const container = document.querySelector(
    `.hydrogen_reviews__container.${widget_id}`
  );
  if (!container || product_reviews.length === 0) return;
  const star_fill_markup = document.querySelector(
    ".hydrogen_reviews__markup--star-fill"
  ).innerHTML;
  const average_rating =
    product_reviews.length > 0
      ? product_reviews.reduce(
          (acc, review) => acc + Number(review.rating),
          0
        ) / product_reviews.length
      : 0;
  const full_stars = Math.floor(average_rating);
  let fill_stars_markup = "";
  Array(full_stars)
    .fill(null)
    .forEach(function () {
      fill_stars_markup += star_fill_markup;
    });
  container.innerHTML = fill_stars_markup;
});
