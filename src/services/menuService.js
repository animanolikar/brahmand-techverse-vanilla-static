"use strict";

const path = require("path");
const fs = require("fs");
const { pool } = require("../config/db");

function formatMenuRow(row) {
  return {
    id: row.id,
    area: row.area,
    label: row.label,
    url: row.url,
    order_index: row.order_index,
    verse_id: row.verse_id,
    verse_code: row.verse_code,
    verse_title: row.verse_title,
  };
}

async function listMenus(area) {
  const params = [];
  let whereSql = "";
  if (area) {
    whereSql = "WHERE m.area = ?";
    params.push(area);
  }
  const [rows] = await pool.query(
    `SELECT m.*, v.code AS verse_code, v.title AS verse_title
     FROM menus m
     LEFT JOIN verses v ON v.id = m.verse_id
     ${whereSql}
     ORDER BY m.area ASC, m.order_index ASC, m.id ASC`,
    params,
  );
  return rows.map(formatMenuRow);
}

async function createMenu(payload) {
  const [result] = await pool.query(
    `INSERT INTO menus (area, label, url, verse_id, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      payload.area,
      payload.label,
      payload.url,
      payload.verse_id || null,
      Number(payload.order_index || 0),
    ],
  );
  const [rows] = await pool.query(
    `SELECT m.*, v.code AS verse_code, v.title AS verse_title
     FROM menus m
     LEFT JOIN verses v ON v.id = m.verse_id
     WHERE m.id = ?`,
    [result.insertId],
  );
  return rows[0] ? formatMenuRow(rows[0]) : null;
}

async function updateMenu(id, payload) {
  await pool.query(
    `UPDATE menus
     SET label = ?, url = ?, verse_id = ?, order_index = ?
     WHERE id = ?`,
    [
      payload.label,
      payload.url,
      payload.verse_id || null,
      Number(payload.order_index || 0),
      id,
    ],
  );
  const [rows] = await pool.query(
    `SELECT m.*, v.code AS verse_code, v.title AS verse_title
     FROM menus m
     LEFT JOIN verses v ON v.id = m.verse_id
     WHERE m.id = ?`,
    [id],
  );
  if (!rows[0]) {
    throw new Error("Menu not found");
  }
  return formatMenuRow(rows[0]);
}

async function deleteMenu(id) {
  await pool.query(`DELETE FROM menus WHERE id = ?`, [id]);
  return true;
}

async function exportMenusJson() {
  const menus = await listMenus();
  const header = menus
    .filter((item) => item.area === "header")
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => ({
      label: item.label,
      url: item.url,
    }));

  const megaGroups = menus.filter((item) => item.area === "mega");
  const mega = megaGroups.reduce((acc, item) => {
    const key = item.verse_title || "Explore";
    let group = acc.find((entry) => entry.title === key);
    if (!group) {
      group = { title: key, links: [] };
      acc.push(group);
    }
    group.links.push({
      label: item.label,
      url: item.url,
    });
    return acc;
  }, []);

  const dataDir = path.join(process.cwd(), "site", "assets", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const payload = {
    header,
    mega,
    generated_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dataDir, "menus.json"), JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

module.exports = {
  listMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  exportMenusJson,
};
