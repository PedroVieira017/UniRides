const allowedDistricts = new Set([
  "aveiro",
  "beja",
  "braga",
  "braganca",
  "castelo branco",
  "coimbra",
  "evora",
  "faro",
  "guarda",
  "leiria",
  "lisboa",
  "portalegre",
  "porto",
  "santarem",
  "setubal",
  "viana do castelo",
  "vila real",
  "viseu",
]);

const normalizeDistrict = (value) => {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const getFavoriteDistricts = async (req, res) => {
  try {
    return res.json({
      districts: req.user.favoriteDistricts || [],
    });
  } catch (err) {
    console.error("Erro a obter distritos favoritos:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

const updateFavoriteDistricts = async (req, res) => {
  try {
    const { districts } = req.body || {};

    if (!Array.isArray(districts)) {
      return res.status(400).json({ message: "Lista invalida" });
    }

    const unique = new Set();
    for (const district of districts) {
      const normalized = normalizeDistrict(district);
      if (normalized && allowedDistricts.has(normalized)) {
        unique.add(normalized);
      }
    }

    req.user.favoriteDistricts = Array.from(unique);
    await req.user.save();

    return res.json({ districts: req.user.favoriteDistricts });
  } catch (err) {
    console.error("Erro a atualizar distritos favoritos:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err.message });
  }
};

module.exports = {
  getFavoriteDistricts,
  updateFavoriteDistricts,
};
