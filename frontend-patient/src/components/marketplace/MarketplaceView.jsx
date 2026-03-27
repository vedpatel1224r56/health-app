import { useEffect, useMemo, useState } from "react";

const LAB_SORT_OPTIONS = [
  { key: "cheapest", label: "Cheapest" },
  { key: "fastest", label: "Fastest" },
  { key: "nearest", label: "Nearest" },
];

const PHARMACY_SORT_OPTIONS = [
  { key: "fastest", label: "Fastest" },
  { key: "cheapest", label: "Lowest fee" },
  { key: "nearest", label: "Nearest" },
];

const REQUEST_VIEW_OPTIONS = [
  { key: "future", label: "Upcoming" },
  { key: "present", label: "In progress" },
  { key: "past", label: "Past" },
];

const PHARMACY_SERVICE_MENU = [
  {
    key: "prescription_home",
    serviceName: "Prescription fulfilment",
    fulfillmentMode: "home_delivery",
    requestLabel: "Add home delivery",
    description: "Partner delivers medicines to your home.",
  },
  {
    key: "monthly_refill",
    serviceName: "Monthly refill basket",
    fulfillmentMode: "home_delivery",
    requestLabel: "Add refill basket",
    description: "Set up a recurring refill request.",
  },
  {
    key: "pickup_counter",
    serviceName: "Prescription pickup",
    fulfillmentMode: "pickup",
    requestLabel: "Add pickup",
    description: "Reserve and collect from the pharmacy counter.",
  },
];

function getLabPrice(lab, mode) {
  return mode === "home" && lab.homeStartingPrice !== null ? lab.homeStartingPrice : lab.startingPrice;
}

function getRequestGroups(requests, requestView) {
  return requests.filter((item) => {
    const status = String(item.status || "requested").toLowerCase();
    if (requestView === "future") return ["requested", "accepted", "scheduled"].includes(status);
    if (requestView === "present") {
      return ["processing", "sample_collected", "out_for_delivery", "ready_for_pickup", "in_progress"].includes(status);
    }
    return ["completed", "fulfilled", "cancelled", "rejected", "unavailable"].includes(status);
  });
}

function buildPharmacyMenu(partner) {
  return PHARMACY_SERVICE_MENU.filter((item) => {
    if (item.fulfillmentMode === "home_delivery") return partner.homeDeliveryAvailable;
    if (item.fulfillmentMode === "pickup") return partner.pickupAvailable;
    return true;
  }).map((item) => ({
    ...item,
    id: `${partner.id}-${item.key}`,
    price: item.fulfillmentMode === "home_delivery" ? Number(partner.deliveryFee || 0) : 0,
  }));
}

function buildPartnerBadges(item, isLabs, mode, sortKey) {
  const badges = [];
  if (sortKey === "cheapest") badges.push("Best value");
  if (sortKey === "fastest") badges.push("Fastest");
  if (sortKey === "nearest") badges.push("Nearest");
  if (isLabs && mode === "home" && item.homeCollectionAvailable) badges.push("Home collection");
  if (!isLabs && item.homeDeliveryAvailable) badges.push("Delivery");
  if (!isLabs && item.pickupAvailable) badges.push("Pickup");
  return badges.slice(0, 3);
}

function ResultRow({ item, isLabs, mode, sortKey, selected, onSelect, formatFulfillmentTime, formatPriceLastUpdated }) {
  const price = isLabs ? getLabPrice(item, mode) : item.deliveryFee;
  const badges = buildPartnerBadges(item, isLabs, mode, sortKey);

  return (
    <button type="button" className={`marketplace-result-row${selected ? " is-selected" : ""}`} onClick={onSelect}>
      <div className="marketplace-result-main">
        <div className="marketplace-result-head">
          <div>
            <p className="marketplace-result-name">{item.partnerName}</p>
            <p className="marketplace-result-meta">
              {item.areaLabel || "Nearby"} • {item.distanceKm} km • {formatFulfillmentTime(item.etaMinutes)}
            </p>
          </div>
          <div className="marketplace-result-price">Rs {price || 0}</div>
        </div>
        <div className="marketplace-badge-row compact">
          {badges.map((badge) => (
            <span key={`${item.id}-${badge}`} className="marketplace-badge">
              {badge}
            </span>
          ))}
        </div>
        <p className="marketplace-result-update">Updated {formatPriceLastUpdated(item.priceLastUpdatedAt)}</p>
      </div>
      <span className="marketplace-result-cta">{selected ? "Selected" : "Open"}</span>
    </button>
  );
}

function ServiceCard({ title, subtitle, priceLabel, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  return (
    <article className="marketplace-service-tile">
      <div className="marketplace-service-header">
        <div>
          <h4>{title}</h4>
          {subtitle ? <p className="micro">{subtitle}</p> : null}
        </div>
        <div className="marketplace-service-price">{priceLabel}</div>
      </div>
      <div className="marketplace-service-actions">
        {secondaryLabel ? (
          <button className="secondary" type="button" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        ) : null}
        <button className="primary" type="button" onClick={onPrimary}>
          {primaryLabel}
        </button>
      </div>
    </article>
  );
}

function RequestCard({ request, timelineOpen, timeline, timelineLoading, toggleTimeline, updateMarketplaceRequestStatus, formatMarketplaceStatus }) {
  return (
    <article className="marketplace-request-card">
      <div className="marketplace-request-head">
        <div>
          <p className="history-headline">{request.service_name || request.partner_name || "Request"}</p>
          <p className="micro">{request.partner_name || "Partner"} • {request.fulfillment_mode || request.mode || "service"}</p>
        </div>
        <span className={`marketplace-status-pill ${String(request.status || "").toLowerCase()}`}>
          {formatMarketplaceStatus(request.status)}
        </span>
      </div>
      <p className="micro">Requested {new Date(request.requested_at || request.created_at).toLocaleString()}</p>
      <div className="action-row compact-wrap">
        <button className="secondary" type="button" onClick={toggleTimeline}>
          {timelineOpen ? "Hide timeline" : "View timeline"}
        </button>
        {["requested", "accepted", "processing", "scheduled"].includes(String(request.status || "").toLowerCase()) ? (
          <button className="ghost" type="button" onClick={() => updateMarketplaceRequestStatus(request.id, "cancelled")}>
            Cancel
          </button>
        ) : null}
      </div>
      {timelineOpen ? (
        <div className="marketplace-timeline">
          {timelineLoading ? (
            <p className="micro">Loading timeline...</p>
          ) : timeline.length === 0 ? (
            <p className="micro">No timeline updates yet.</p>
          ) : (
            <ol className="marketplace-timeline-list">
              {timeline.map((item) => (
                <li key={`timeline-${request.id}-${item.id}`}>
                  <p className="timeline-title">{formatMarketplaceStatus(item.status)}</p>
                  <p className="micro">{item.note || "Partner updated the request."}</p>
                  <p className="micro">{new Date(item.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </article>
  );
}

export function MarketplaceView({
  type,
  labListings,
  pharmacyListings,
  labAreaSearch,
  setLabAreaSearch,
  labArea,
  setLabArea,
  labAreas,
  labMode,
  setLabMode,
  activeLabId,
  setActiveLabId,
  labSort,
  setLabSort,
  pharmacySearch,
  setPharmacySearch,
  pharmacyMode,
  setPharmacyMode,
  pharmacySort,
  setPharmacySort,
  cartItems,
  cartTotal,
  setCartOpen,
  marketplaceLoading,
  marketplaceRequests,
  marketplaceTimelineOpenByRequest,
  toggleMarketplaceRequestTimeline,
  updateMarketplaceRequestStatus,
  marketplaceTimelineByRequest,
  marketplaceTimelineLoadingByRequest,
  marketplaceStatus,
  marketplaceAnalytics,
  labRequestsView,
  setLabRequestsView,
  pharmacyRequestsView,
  setPharmacyRequestsView,
  sortLabs,
  sortPharmacies,
  formatPriceLastUpdated,
  formatFulfillmentTime,
  formatMarketplaceStatus,
  addToCart,
}) {
  const isLabs = type === "labs";
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);
  const [labMenuView, setLabMenuView] = useState("tests");

  const rawItems = isLabs ? labListings : pharmacyListings;
  const searchQuery = isLabs ? String(labAreaSearch || "").trim().toLowerCase() : String(pharmacySearch || "").trim().toLowerCase();
  const requestView = isLabs ? labRequestsView : pharmacyRequestsView;
  const setRequestView = isLabs ? setLabRequestsView : setPharmacyRequestsView;
  const requestType = isLabs ? "lab" : "pharmacy";
  const metrics = isLabs ? marketplaceAnalytics.lab : marketplaceAnalytics.pharmacy;
  const sortKey = isLabs ? labSort : pharmacySort;
  const mode = isLabs ? labMode : pharmacyMode;

  const filteredItems = useMemo(() => {
    let items = rawItems;
    if (isLabs) {
      if (labArea !== "all") {
        items = items.filter((lab) => String(lab.areaLabel || "").toLowerCase() === String(labArea).toLowerCase());
      }
      if (searchQuery) {
        items = items.filter((lab) => `${lab.partnerName || ""} ${lab.areaLabel || ""}`.toLowerCase().includes(searchQuery));
      }
      return sortLabs(items, labMode, labSort);
    }

    if (searchQuery) {
      items = items.filter((pharmacy) => `${pharmacy.partnerName || ""} ${pharmacy.areaLabel || ""}`.toLowerCase().includes(searchQuery));
    }
    if (pharmacyMode === "home_delivery") items = items.filter((pharmacy) => pharmacy.homeDeliveryAvailable);
    if (pharmacyMode === "pickup") items = items.filter((pharmacy) => pharmacy.pickupAvailable);
    return sortPharmacies(items, pharmacySort);
  }, [isLabs, rawItems, labArea, searchQuery, sortLabs, labMode, labSort, sortPharmacies, pharmacySort, pharmacyMode]);

  const selectedItem = useMemo(() => {
    if (isLabs) return filteredItems.find((item) => item.id === activeLabId) || filteredItems[0] || null;
    return filteredItems.find((item) => item.id === selectedPharmacyId) || filteredItems[0] || null;
  }, [filteredItems, isLabs, activeLabId, selectedPharmacyId]);

  useEffect(() => {
    if (!selectedItem) return;
    if (isLabs && selectedItem.id !== activeLabId) setActiveLabId(selectedItem.id);
    if (!isLabs && selectedItem.id !== selectedPharmacyId) setSelectedPharmacyId(selectedItem.id);
  }, [selectedItem, isLabs, activeLabId, selectedPharmacyId, setActiveLabId]);

  const requestFeed = useMemo(
    () => getRequestGroups(marketplaceRequests.filter((item) => item.request_type === requestType), requestView).slice(0, 8),
    [marketplaceRequests, requestType, requestView],
  );

  const pharmacyMenu = selectedItem && !isLabs ? buildPharmacyMenu(selectedItem) : [];
  const activeLabServices = selectedItem ? (labMenuView === "tests" ? selectedItem.tests : selectedItem.packages) : [];
  const selectedBadges = selectedItem ? buildPartnerBadges(selectedItem, isLabs, mode, sortKey) : [];

  return (
    <div className="marketplace-studio">
      <section className="marketplace-topbar">
        <div>
          <p className="eyebrow">{isLabs ? "Diagnostics marketplace" : "Pharmacy marketplace"}</p>
          <h3>{isLabs ? "Book tests without digging through long lists" : "Choose a pharmacy quickly and order with clarity"}</h3>
          <p className="panel-sub">
            {isLabs
              ? "Search by area, compare prices and ETAs, then add the exact test or package you need."
              : "Search nearby pharmacies, check delivery or pickup options, and place a request with less friction."}
          </p>
        </div>
        <button className="marketplace-cart-btn" type="button" onClick={() => setCartOpen(true)}>
          Cart {cartItems.length} • Rs {cartTotal}
        </button>
      </section>

      <section className="marketplace-filter-bar">
        <div className="marketplace-filter-grid">
          {isLabs ? (
            <>
              <label className="block">
                Collection mode
                <select value={labMode} onChange={(event) => setLabMode(event.target.value)}>
                  <option value="home">Home collection</option>
                  <option value="all">In-person / Any</option>
                </select>
              </label>
              <label className="block">
                Area
                <select value={labArea} onChange={(event) => setLabArea(event.target.value)}>
                  <option value="all">All areas</option>
                  {labAreas.map((areaOption) => (
                    <option key={`lab-area-${areaOption}`} value={areaOption}>
                      {areaOption}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Search lab or area
                <input type="search" value={labAreaSearch} placeholder="Search lab or area" onChange={(event) => setLabAreaSearch(event.target.value)} />
              </label>
            </>
          ) : (
            <>
              <label className="block">
                Fulfilment mode
                <select value={pharmacyMode} onChange={(event) => setPharmacyMode(event.target.value)}>
                  <option value="home_delivery">Home delivery</option>
                  <option value="pickup">Pickup</option>
                  <option value="all">Any</option>
                </select>
              </label>
              <label className="block marketplace-filter-wide">
                Search pharmacy or area
                <input type="search" value={pharmacySearch} placeholder="Search pharmacy or area" onChange={(event) => setPharmacySearch(event.target.value)} />
              </label>
            </>
          )}
        </div>
        <div className="marketplace-chip-row">
          {(isLabs ? LAB_SORT_OPTIONS : PHARMACY_SORT_OPTIONS).map((option) => (
            <button
              key={`${type}-${option.key}`}
              type="button"
              className={sortKey === option.key ? "primary" : "secondary"}
              onClick={() => {
                if (isLabs) setLabSort(option.key);
                else setPharmacySort(option.key);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {marketplaceStatus ? <p className="micro">{marketplaceStatus}</p> : null}
      {marketplaceLoading ? <p className="micro">Loading nearby options...</p> : null}

      <section className="marketplace-layout-grid">
        <aside className="marketplace-results-panel">
          <div className="marketplace-panel-head">
            <div>
              <p className="eyebrow">Results</p>
              <h3>{filteredItems.length} partners</h3>
            </div>
            <span className="marketplace-panel-note">{isLabs ? "Tap a lab" : "Tap a pharmacy"}</span>
          </div>
          <div className="marketplace-results-list">
            {filteredItems.length === 0 ? (
              <div className="marketplace-empty-state">
                <p className="history-headline">No partners found</p>
                <p className="micro">Change area, mode, or search text to widen results.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <ResultRow
                  key={`${type}-${item.id}`}
                  item={item}
                  isLabs={isLabs}
                  mode={mode}
                  sortKey={sortKey}
                  selected={selectedItem?.id === item.id}
                  onSelect={() => {
                    if (isLabs) setActiveLabId(item.id);
                    else setSelectedPharmacyId(item.id);
                  }}
                  formatFulfillmentTime={formatFulfillmentTime}
                  formatPriceLastUpdated={formatPriceLastUpdated}
                />
              ))
            )}
          </div>
        </aside>

        <section className="marketplace-focus-panel">
          {!selectedItem ? (
            <div className="marketplace-empty-focus">
              <p className="history-headline">Select a partner</p>
              <p className="micro">Partner details and services will appear here.</p>
            </div>
          ) : (
            <>
              <div className="marketplace-focus-card marketplace-focus-header-card">
                <div className="marketplace-focus-header">
                  <div>
                    <p className="eyebrow">Selected {isLabs ? "lab" : "pharmacy"}</p>
                    <h3>{selectedItem.partnerName}</h3>
                    <p className="panel-sub">
                      {selectedItem.areaLabel || "Nearby"} • {selectedItem.distanceKm} km • {formatFulfillmentTime(selectedItem.etaMinutes)}
                    </p>
                  </div>
                  <div className="marketplace-focus-price-block">
                    <span className="micro">Starting from</span>
                    <strong>Rs {isLabs ? getLabPrice(selectedItem, labMode) || 0 : selectedItem.deliveryFee || 0}</strong>
                  </div>
                </div>
                <div className="marketplace-badge-row">
                  {selectedBadges.map((badge) => (
                    <span key={`${selectedItem.id}-${badge}`} className="marketplace-badge">
                      {badge}
                    </span>
                  ))}
                </div>
                <div className="marketplace-kpi-strip">
                  <div className="marketplace-kpi-chip">
                    <span>Updated</span>
                    <strong>{formatPriceLastUpdated(selectedItem.priceLastUpdatedAt)}</strong>
                  </div>
                  <div className="marketplace-kpi-chip">
                    <span>SLA</span>
                    <strong>{selectedItem.etaSlaMinutes || selectedItem.etaMinutes || "-"} min</strong>
                  </div>
                  <div className="marketplace-kpi-chip">
                    <span>{isLabs ? "Tests" : "Services"}</span>
                    <strong>{isLabs ? selectedItem.tests.length + selectedItem.packages.length : pharmacyMenu.length}</strong>
                  </div>
                </div>
              </div>

              {isLabs ? (
                <>
                  <div className="marketplace-focus-card marketplace-segment-card">
                    <div className="marketplace-panel-head slim">
                      <div>
                        <p className="eyebrow">Menu</p>
                        <h3>{labMenuView === "tests" ? "Tests" : "Packages"}</h3>
                      </div>
                    </div>
                    <div className="marketplace-chip-row">
                      <button type="button" className={labMenuView === "tests" ? "primary" : "secondary"} onClick={() => setLabMenuView("tests")}>
                        Tests ({selectedItem.tests.length})
                      </button>
                      <button type="button" className={labMenuView === "packages" ? "primary" : "secondary"} onClick={() => setLabMenuView("packages")}>
                        Packages ({selectedItem.packages.length})
                      </button>
                    </div>
                  </div>
                  <div className="marketplace-service-grid">
                    {activeLabServices.map((item) => (
                      <ServiceCard
                        key={`${labMenuView}-${item.id}`}
                        title={item.serviceName}
                        subtitle={item.homeCollectionAvailable ? "Home collection available" : "In-person only"}
                        priceLabel={`Rs ${item.price}`}
                        secondaryLabel={item.homeCollectionAvailable ? `Home • Rs ${item.homeVisitPrice !== null ? item.homeVisitPrice : item.price}` : null}
                        onSecondary={
                          item.homeCollectionAvailable
                            ? () =>
                                addToCart({
                                  requestType: "lab",
                                  partnerId: selectedItem.id,
                                  partnerName: selectedItem.partnerName,
                                  serviceName: item.serviceName,
                                  fulfillmentMode: "home_visit",
                                  listedPrice: item.homeVisitPrice !== null ? item.homeVisitPrice : item.price,
                                  notes: `${selectedItem.partnerName} • ${item.serviceName} • home collection`,
                                })
                            : undefined
                        }
                        primaryLabel={labMenuView === "tests" ? `In-person • Rs ${item.price}` : `Add package • Rs ${item.price}`}
                        onPrimary={() =>
                          addToCart({
                            requestType: "lab",
                            partnerId: selectedItem.id,
                            partnerName: selectedItem.partnerName,
                            serviceName: item.serviceName,
                            fulfillmentMode: "in_person",
                            listedPrice: item.price,
                            notes: `${selectedItem.partnerName} • ${item.serviceName} • ${labMenuView === "tests" ? "in-person" : "package"}`,
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="marketplace-focus-card marketplace-copy-card">
                    <p className="eyebrow">Pricing note</p>
                    <p className="panel-sub compact-copy">{selectedItem.medicinePriceNote || "Medicine cost is confirmed by the pharmacy partner after they review the request."}</p>
                  </div>
                  <div className="marketplace-service-grid">
                    {pharmacyMenu.map((item) => (
                      <ServiceCard
                        key={item.id}
                        title={item.serviceName}
                        subtitle={item.description}
                        priceLabel={item.fulfillmentMode === "pickup" ? "Rs 0" : `Rs ${item.price}`}
                        primaryLabel={item.requestLabel}
                        onPrimary={() =>
                          addToCart({
                            requestType: "pharmacy",
                            partnerId: selectedItem.id,
                            partnerName: selectedItem.partnerName,
                            serviceName: item.serviceName,
                            fulfillmentMode: item.fulfillmentMode,
                            listedPrice: item.fulfillmentMode === "pickup" ? 0 : item.price,
                            notes: `${selectedItem.partnerName} • ${item.serviceName} • ${item.fulfillmentMode}`,
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </section>

      <section className="marketplace-requests-section marketplace-requests-shell">
        <div className="marketplace-panel-head">
          <div>
            <p className="eyebrow">Your requests</p>
            <h3>{isLabs ? "Lab requests" : "Pharmacy requests"}</h3>
          </div>
          <div className="marketplace-chip-row">
            {REQUEST_VIEW_OPTIONS.map((option) => (
              <button
                key={`${type}-request-${option.key}`}
                type="button"
                className={requestView === option.key ? "primary" : "secondary"}
                onClick={() => setRequestView(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="marketplace-analytics-grid compact-grid">
          <article className="marketplace-analytics-card">
            <p className="marketplace-analytics-label">Requests</p>
            <strong className="marketplace-analytics-value">{metrics.totalRequests || 0}</strong>
          </article>
          <article className="marketplace-analytics-card">
            <p className="marketplace-analytics-label">Conversion</p>
            <strong className="marketplace-analytics-value">{Math.round(metrics.conversionRate || 0)}%</strong>
          </article>
          <article className="marketplace-analytics-card">
            <p className="marketplace-analytics-label">Cancel rate</p>
            <strong className="marketplace-analytics-value">{Math.round(metrics.cancelRate || 0)}%</strong>
          </article>
          <article className="marketplace-analytics-card">
            <p className="marketplace-analytics-label">Avg fulfilment</p>
            <strong className="marketplace-analytics-value">{Math.round(metrics.avgFulfillmentMinutes || 0)} min</strong>
          </article>
        </div>

        <div className="marketplace-request-grid request-grid-tight">
          {requestFeed.length === 0 ? (
            <div className="marketplace-empty-state">
              <p className="history-headline">No requests here yet</p>
              <p className="micro">Place a request and its status will appear here.</p>
            </div>
          ) : (
            requestFeed.map((request) => (
              <RequestCard
                key={`${type}-request-card-${request.id}`}
                request={request}
                timelineOpen={marketplaceTimelineOpenByRequest[request.id]}
                timeline={marketplaceTimelineByRequest[request.id] || []}
                timelineLoading={marketplaceTimelineLoadingByRequest[request.id]}
                toggleTimeline={() => toggleMarketplaceRequestTimeline(request.id)}
                updateMarketplaceRequestStatus={updateMarketplaceRequestStatus}
                formatMarketplaceStatus={formatMarketplaceStatus}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
