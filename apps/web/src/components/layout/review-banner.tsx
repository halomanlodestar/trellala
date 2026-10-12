import { loadReviewCounts } from "@/server/queries/review";
import { ReviewBannerLive } from "./review-banner-live";

export async function ReviewBanner() {
  return <ReviewBannerLive initial={await loadReviewCounts()} />;
}
