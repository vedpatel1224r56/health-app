const createMarketplaceService = ({ all, get }) => {
  const resolveLabPartnerNameById = async (partnerId) => {
    if (!partnerId) return "";
    const fromPackages = await get("SELECT partner_name FROM lab_packages WHERE id = ? LIMIT 1", [partnerId]);
    if (fromPackages?.partner_name) return fromPackages.partner_name;
    const fromTests = await get("SELECT partner_name FROM lab_tests WHERE id = ? LIMIT 1", [partnerId]);
    return fromTests?.partner_name || "";
  };

  const buildMarketplaceFallbackOptions = async ({
    requestType,
    partnerId,
    fulfillmentMode,
    serviceName,
  }) => {
    if (requestType === "lab") {
      const currentPartnerName = await resolveLabPartnerNameById(partnerId);
      const rows = await all(
        `WITH lab_items AS (
           SELECT id AS source_id,
                  partner_name,
                  package_name AS service_name,
                  price,
                  home_visit_price,
                  home_collection_available,
                  eta_minutes,
                  eta_sla_minutes,
                  distance_km,
                  area_label
           FROM lab_packages
           WHERE active = 1
           UNION ALL
           SELECT id AS source_id,
                  partner_name,
                  test_name AS service_name,
                  price,
                  home_visit_price,
                  home_collection_available,
                  eta_minutes,
                  eta_sla_minutes,
                  distance_km,
                  area_label
           FROM lab_tests
           WHERE active = 1
         )
         SELECT source_id,
                partner_name,
                service_name,
                CASE
                  WHEN ? = 'home_visit' THEN COALESCE(home_visit_price, price)
                  ELSE price
                END AS listed_price,
                eta_minutes,
                eta_sla_minutes,
                distance_km,
                area_label
         FROM lab_items
         WHERE (? != 'home_visit' OR home_collection_available = 1)
           AND (? = '' OR partner_name <> ?)
         ORDER BY
           CASE WHEN LOWER(service_name) = LOWER(?) THEN 0 ELSE 1 END ASC,
           listed_price ASC,
           distance_km ASC,
           eta_minutes ASC
         LIMIT 3`,
        [
          fulfillmentMode,
          fulfillmentMode,
          currentPartnerName || "",
          currentPartnerName || "",
          serviceName || "",
        ],
      );
      return rows.map((row) => ({
        requestType: "lab",
        partnerId: row.source_id,
        partnerName: row.partner_name,
        serviceName: row.service_name,
        fulfillmentMode,
        listedPrice: Number(row.listed_price || 0),
        etaMinutes: row.eta_minutes || null,
        etaSlaMinutes: row.eta_sla_minutes || row.eta_minutes || null,
        distanceKm: row.distance_km || null,
        areaLabel: row.area_label || null,
        note: `${row.partner_name} • ${row.area_label || "Nearby"} • ${row.eta_minutes || "-"} min`,
      }));
    }

    if (requestType === "pharmacy") {
      const rows = await all(
        `SELECT id, partner_name, area_label, delivery_fee, eta_minutes, eta_sla_minutes, distance_km
         FROM pharmacy_partners
         WHERE active = 1
           AND id <> ?
           AND (? != 'home_delivery' OR home_delivery_available = 1)
           AND (? != 'pickup' OR pickup_available = 1)
         ORDER BY delivery_fee ASC, distance_km ASC, eta_minutes ASC
         LIMIT 3`,
        [partnerId, fulfillmentMode, fulfillmentMode],
      );
      return rows.map((row) => ({
        requestType: "pharmacy",
        partnerId: row.id,
        partnerName: row.partner_name,
        serviceName: serviceName || "Prescription fulfilment",
        fulfillmentMode,
        listedPrice: Number(row.delivery_fee || 0),
        etaMinutes: row.eta_minutes || null,
        etaSlaMinutes: row.eta_sla_minutes || row.eta_minutes || null,
        distanceKm: row.distance_km || null,
        areaLabel: row.area_label || null,
        note: `${row.partner_name} • ${row.area_label || "Nearby"} • ${row.eta_minutes || "-"} min`,
      }));
    }

    return [];
  };

  return {
    resolveLabPartnerNameById,
    buildMarketplaceFallbackOptions,
  };
};

module.exports = { createMarketplaceService };
