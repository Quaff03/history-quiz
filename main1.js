/* ID 规则 v2 —— 浏览器端数据修补（2026-10-30 v2 修订）
   ① 作答/标记/掌握度里的旧题号键名：q-l01-01 → q-b8a-l01-01（只跑一次，标记 hx.id.v2）
   ② 题库快照 hx.bank.v1：迁移前存下的副本里，知识点仍指向 kp-l01-01，
      与内置 QX_KPS（kp-b8a-l01-01）对不上 → 练习页出现「该范围共 0 题可用」。
      这里把快照里的 id / lessonId / unitId / knowledgePointIds 一并迁移；
      迁移后自检，仍不合规就直接丢弃快照（回落内置题库），不让页面卡在 0 题。
   ③ 范围快照 hx.catalog.v1 同理。 */
(function () {
	try {
		var VOL = "b8a";
		/* 换册时要同步改这里 */
		function isIdLike(s) {
			return /^(q|kp)-l\d\d-\d\d$/.test(s) || /^(q|kp)-t\d\d-\d\d$/.test(s) || /^l\d\d$/.test(s) || /^u\d\d$/.test(s) || /^t\d\d$/.test(s);
		}
		function nid(s) {
			return String(s).replace(/^q-l(\d\d)-/, "q-" + VOL + "-l$1-").replace(/^q-t(\d\d)-/, "q-" + VOL + "-t$1-").replace(/^kp-l(\d\d)-/, "kp-" + VOL + "-l$1-").replace(/^l(\d\d)$/, "l-" + VOL + "-$1").replace(/^u(\d\d)$/, "u-" + VOL + "-$1").replace(/^t(\d\d)$/, "t-" + VOL + "-$1");
		}
		function deep(v) {
			if (typeof v === "string")
				return isIdLike(v) ? nid(v) : v;
			if (Array.isArray(v))
				return v.map(deep);
			if (v && typeof v === "object") {
				var o = {};
				for (var k in v) {
					if (!Object.prototype.hasOwnProperty.call(v, k))
						continue;
					o[k] = deep(v[k]);
				}
				return o;
			}
			return v;
		}
		function has(o, k) {
			return Object.prototype.hasOwnProperty.call(o, k);
		}
		/* ① 以题号为键的映射表 */
		if (localStorage.getItem("hx.id.v2") !== "1") {
			["hx.ans.v2", "hx.flag.v1", "hx.mastery.v1", "hx.records.v1"].forEach(
				function (k) {
					var raw = localStorage.getItem(k);
					if (!raw)
						return;
					var o;
					try {
						o = JSON.parse(raw);
					} catch (e) {
						return;
					}
					if (!o || typeof o !== "object")
						return;
					var out;
					if (Array.isArray(o)) {
						out = deep(o);
					} else {
						out = {};
						for (var key in o) {
							if (!has(o, key))
								continue;
							out[isIdLike(key) ? nid(key) : key] = deep(o[key]);
						}
					}
					try {
						if (JSON.stringify(out) !== JSON.stringify(o))
							localStorage.setItem(k, JSON.stringify(out));
					} catch (e) {}
				}
			);
			localStorage.setItem("hx.id.v2", "1");
		}
		/* ② 题库快照（与上面独立，老设备已置 hx.id.v2 也要跑）
       规则：用户自己导入过的（contentVersion 以 import- 开头）保留；
             与内置版本一致（SEED）的保留；
             其余说明内置题库已换版，直接丢弃快照回落内置。
       ⚠ 以后改内置题库（Pd）必须同步改下面的 SEED，否则老设备看不到新题。 */
		var SEED = "seed-2026-10-29";
		if (localStorage.getItem("hx.bank.v2") !== "1") {
			var rawBank = localStorage.getItem("hx.bank.v1");
			if (rawBank) {
				var bk = null;
				try {
					bk = JSON.parse(rawBank);
				} catch (e) {
					bk = null;
				}
				var cv = bk && bk.contentVersion ? String(bk.contentVersion) : "";
				var keep = /^import-/.test(cv) || cv === SEED;
				if (!keep) {
					localStorage.removeItem("hx.bank.v1");
				} else
					if (bk && Array.isArray(bk.questions) && bk.questions.length) {
						var fixed = deep(bk);
						var q0 = fixed.questions[0] || {};
						if (/^q-b8a-/.test(String(q0.id || ""))) {
							fixed.contentVersion = SEED;
							try {
								localStorage.setItem("hx.bank.v1", JSON.stringify(fixed));
							} catch (e) {}
						} else {
							localStorage.removeItem("hx.bank.v1");
							/* 结构异常，丢弃快照回落内置 */
						}
					}
			}
			localStorage.setItem("hx.bank.v2", "1");
		}
		/* ③ 范围快照 */
		if (localStorage.getItem("hx.catalog.v2") !== "1") {
			var rawCat = localStorage.getItem("hx.catalog.v1");
			if (rawCat) {
				var ct = null;
				try {
					ct = JSON.parse(rawCat);
				} catch (e) {
					ct = null;
				}
				if (ct && typeof ct === "object") {
					try {
						localStorage.setItem("hx.catalog.v1", JSON.stringify(deep(ct)));
					} catch (e) {}
				}
			}
			localStorage.setItem("hx.catalog.v2", "1");
		}
	} catch (e) {}
})();