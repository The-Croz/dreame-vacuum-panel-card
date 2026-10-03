/*!
 * Dreame Vacuum Panel Card
 * A panel-mode Lovelace card for the Tasshack/dreame-vacuum integration.
 * Desktop, tablet and phone layouts in one card. MIT License.
 */
(() => {
  const VERSION = '0.1.0';
  const TAG = 'dreame-vacuum-panel-card';

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const human = (s) => {
    if (s === null || s === undefined || s === '') return '';
    const t = String(s).replace(/_/g, ' ').trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const ic = (name, extra = '') => `<ha-icon icon="${esc(name)}" ${extra}></ha-icon>`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const num = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));
  const OFF_STATES = ['unavailable', 'unknown'];

  // Short labels for compact segmented buttons (raw option keys and translated text)
  const SHORT = {
    sweeping: 'Vacuum', Sweeping: 'Vacuum',
    mopping: 'Mop', Mopping: 'Mop',
    sweeping_and_mopping: 'Vac + Mop', 'Sweeping and mopping': 'Vac + Mop',
    mopping_after_sweeping: 'Mop after', 'Mopping after sweeping': 'Mop after',
    routine_cleaning: 'Routine', 'Routine cleaning': 'Routine',
    deep_cleaning: 'Deep', 'Deep cleaning': 'Deep',
    in_deep_mode: 'Deep mode', in_all_modes: 'All modes',
    water_saving: 'Water saving', high_frequency: 'High', low_frequency: 'Low',
  };
  const MODE_ICON = {
    sweeping: 'mdi:fan',
    mopping: 'mdi:water-outline',
    sweeping_and_mopping: 'mdi:robot-vacuum',
    mopping_after_sweeping: 'mdi:debug-step-over',
  };
  const CONS = {
    main_brush: ['Main brush', 'mdi:brush'],
    side_brush: ['Side brush', 'mdi:fan'],
    filter: ['Filter', 'mdi:air-filter'],
    sensor_dirty: ['Sensors', 'mdi:radar'],
    mop_pad: ['Mop pads', 'mdi:water-outline'],
    silver_ion: ['Silver-ion module', 'mdi:shield-plus-outline'],
    detergent: ['Detergent', 'mdi:bottle-tonic-outline'],
    squeegee: ['Squeegee', 'mdi:wiper'],
    tank_filter: ['Tank filter', 'mdi:air-filter'],
    deodorizer: ['Deodorizer', 'mdi:scent'],
    wheel: ['Wheel', 'mdi:tire'],
    scale_inhibitor: ['Scale inhibitor', 'mdi:water-check-outline'],
    dirty_water_tank: ['Dirty water tank', 'mdi:cup-water'],
    onboard_dirty_water_tank: ['Onboard dirty tank', 'mdi:cup-water'],
    fluffing_roller: ['Fluffing roller', 'mdi:rotate-3d-variant'],
    roller_mop_filter: ['Roller mop filter', 'mdi:air-filter'],
    water_outlet_filter: ['Water outlet filter', 'mdi:air-filter'],
  };
  const RESET_NAME = { sensor_dirty: 'sensor' };

  // Keys used by the cleaning controls (kept out of the generic settings lists)
  const CLEAN_KEYS = ['cleaning_mode', 'suction_level', 'mop_pad_humidity', 'water_volume', 'cleaning_route', 'cleangenius', 'customized_cleaning', 'selected_map'];
  const DOCK_KEYS = ['self_clean', 'self_clean_area', 'self_clean_by_zone', 'self_clean_frequency', 'mop_wash_level', 'auto_rewashing', 'auto_drying', 'drying_time', 'auto_empty_mode', 'auto_dust_collecting', 'auto_empty_frequency', 'auto_water_refilling', 'auto_add_detergent', 'water_electrolysis', 'mop_clean_frequency', 'washing_mode', 'water_temperature', 'smart_mop_washing', 'smart_drying', 'hot_washing'];
  const GROUPS = [
    ['cleaning', 'Cleaning', 'mdi:broom', ['resume_cleaning', 'cleaning_sequence', 'collision_avoidance', 'floor_direction_cleaning', 'gap_cleaning_extension', 'max_suction_power', 'auto_recleaning', 'intelligent_recognition', 'side_reach', 'cleaning_times']],
    ['mopping', 'Mopping', 'mdi:water-outline', ['tight_mopping', 'auto_mount_mop', 'mopping_under_furnitures', 'mop_pad_swing', 'wetness_level', 'mop_extend', 'mop_extend_frequency', 'stain_avoidance', 'mopping_type', 'mop_pressure', 'mop_temperature', 'uv_sterilization']],
    ['carpet', 'Carpet', 'mdi:rug', ['carpet_boost', 'carpet_recognition', 'carpet_avoidance', 'carpet_cleaning', 'carpet_sensitivity', 'intensive_carpet_cleaning', 'clean_carpets_first']],
    ['ai', 'Obstacle avoidance', 'mdi:eye-outline', ['obstacle_avoidance', 'ai_obstacle_detection', 'ai_obstacle_picture', 'ai_obstacle_image_upload', 'ai_pet_detection', 'ai_human_detection', 'ai_furniture_detection', 'ai_fluid_detection', 'fuzzy_obstacle_detection', 'pet_picture', 'pet_focused_detection', 'pet_focused_cleaning', 'fill_light', 'human_follow', 'camera_light_brightness', 'camera_light_brightness_auto']],
    ['quiet', 'Schedule & sound', 'mdi:volume-high', ['dnd', 'dnd_start', 'dnd_end', 'volume', 'voice_assistant', 'voice_assistant_language', 'streaming_voice_prompt', 'off_peak_charging', 'off_peak_charging_start', 'off_peak_charging_end']],
    ['general', 'General', 'mdi:cog-outline', ['child_lock', 'multi_floor_map', 'map_saving', 'map_rotation']],
  ];
  const DESTRUCTIVE = ['start_mapping', 'start_fast_mapping', 'base_station_self_repair', 'water_tank_draining', 'backup_saved_map', 'start_recleaning'];

  /* ------------------------------------------------------------------ */
  /* Styles                                                              */
  /* ------------------------------------------------------------------ */
  const CSS = `
:host{display:block}
:host(.fs){height:0}
*{box-sizing:border-box}
[hidden]{display:none!important}
ha-card.dv{
  --dv-bg:var(--ha-card-background,var(--card-background-color,#fff));
  --dv-page:var(--primary-background-color,#f2f3f5);
  --dv-bg2:var(--secondary-background-color,#eef0f3);
  --dv-text:var(--primary-text-color,#1d2025);
  --dv-text2:var(--secondary-text-color,#5b616b);
  --dv-div:var(--divider-color,rgba(0,0,0,.12));
  --dv-p:var(--dvpc-accent,var(--primary-color,#03a9f4));
  --dv-pbtn:color-mix(in srgb,var(--dv-p) 78%,#000);
  --dv-pt:color-mix(in srgb,var(--dv-p) 72%,var(--dv-text));
  --dv-tint:color-mix(in srgb,var(--dv-p) 15%,transparent);
  --dv-ok:var(--success-color,#43a047);
  --dv-warn:var(--warning-color,#ffa600);
  --dv-err:var(--error-color,#db4437);
  --dv-warnt:color-mix(in srgb,var(--dv-warn) 62%,var(--dv-text));
  --dv-errt:color-mix(in srgb,var(--dv-err) 75%,var(--dv-text));
  --dv-warnbg:color-mix(in srgb,var(--dv-warn) 15%,var(--dv-bg));
  --dv-errbg:color-mix(in srgb,var(--dv-err) 13%,var(--dv-bg));
  --dv-r:var(--ha-card-border-radius,12px);
  --dv-mapbg:var(--dv-bg2);
  height:var(--dv-h);min-height:480px;position:relative;overflow:hidden;isolation:isolate;
  background:var(--dv-page);color:var(--dv-text);
  font-family:var(--ha-font-family-body,Roboto,'Helvetica Neue',system-ui,sans-serif);
  -webkit-font-smoothing:antialiased;
}
ha-card.dv.fs{position:fixed;top:var(--dv-top,0);left:var(--dv-left,0);width:var(--dv-w,100%);bottom:0;height:auto;min-height:0;z-index:1;border-radius:0;overscroll-behavior:none}
ha-icon{--mdc-icon-size:20px;display:inline-flex;flex-shrink:0}
button{font-family:inherit;color:inherit}
.panel{background:var(--dv-bg);border:1px solid var(--dv-div);border-radius:var(--dv-r);min-width:0}
.pad{padding:18px}
.h{font-size:16px;font-weight:500;margin:0;line-height:1.3}
.h-xl{font-size:22px;font-weight:400;margin:0}
.muted{color:var(--dv-text2)}
.small{font-size:13px}
.xs{font-size:12px}
.lbl{font-size:12px;font-weight:500;letter-spacing:.05em;text-transform:uppercase;color:var(--dv-text2)}
.stack{display:flex;flex-direction:column;gap:12px;min-width:0}
.stack-s{display:flex;flex-direction:column;gap:8px;min-width:0}
.rowf{display:flex;align-items:center;gap:10px;min-width:0}
.between{display:flex;align-items:center;justify-content:space-between;gap:12px}
.grow{flex:1 1 auto;min-width:0}
.ell{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;background:var(--dv-text2)}
.dot.ok{background:var(--dv-ok)}.dot.warn{background:var(--dv-warn)}.dot.err{background:var(--dv-err)}
.bar{height:6px;border-radius:3px;background:var(--dv-bg2);overflow:hidden}
.bar>i{display:block;height:100%;border-radius:3px;background:var(--dv-p)}
.link{background:none;border:0;padding:8px 0;color:var(--dv-pt);font-size:13px;font-weight:500;cursor:pointer}
/* buttons */
.btn{min-height:44px;border-radius:22px;border:1px solid var(--dv-div);background:var(--dv-bg);color:var(--dv-text);font-size:14px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 16px;cursor:pointer;white-space:nowrap}
.btn:hover{background:var(--dv-bg2)}
.btn.pri{background:var(--dv-pbtn);color:#fff;border-color:transparent}
.btn.pri:hover{filter:brightness(1.08)}
.btn.sm{min-height:36px;border-radius:18px;font-size:13px;padding:0 12px}
.btn.ghost{border-color:transparent;background:transparent;color:var(--dv-text2)}
.btn.sq{width:48px;padding:0}
.btn[disabled]{opacity:.45;cursor:default;filter:none}
.ibtn{width:44px;height:44px;border-radius:50%;border:0;background:transparent;color:var(--dv-text2);display:grid;place-items:center;cursor:pointer;padding:0;position:relative}
.ibtn:hover{background:var(--dv-bg2);color:var(--dv-text)}
.fab{width:48px;height:48px;border-radius:50%;border:1px solid var(--dv-div);background:var(--dv-bg);color:var(--dv-text);display:grid;place-items:center;cursor:pointer;padding:0;position:relative;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.fab.on{background:var(--dv-tint);color:var(--dv-pt);border-color:transparent}
.badge{position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;border-radius:9px;background:var(--dv-err);color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center;padding:0 4px}
.tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:68px;border-radius:12px;border:1px solid var(--dv-div);background:var(--dv-bg);color:var(--dv-text);font-size:13px;font-weight:500;cursor:pointer;padding:6px}
.tile:hover{background:var(--dv-bg2)}
.tile.on{background:var(--dv-tint);border-color:transparent;color:var(--dv-pt)}
.tile[disabled]{opacity:.45;cursor:default}
/* segmented */
.seg{display:flex;gap:4px;padding:4px;background:var(--dv-bg2);border-radius:10px}
.seg button{flex:1 1 0;min-width:0;min-height:38px;border:0;background:transparent;border-radius:8px;font-size:13px;font-weight:500;color:var(--dv-text2);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:4px 3px;line-height:1.15;text-align:center}
.seg button.on{background:var(--dv-bg);color:var(--dv-pt);box-shadow:0 0 0 1px var(--dv-div),0 1px 3px rgba(0,0,0,.08)}
.seg.float{background:var(--dv-bg);border:1px solid var(--dv-div);box-shadow:0 4px 16px rgba(0,0,0,.14);width:min(440px,100%)}
.seg.float button{white-space:nowrap}
.seg.float button.on{background:var(--dv-tint);box-shadow:none}
.seg.dis{opacity:.45;pointer-events:none}
/* switch */
.sw{width:46px;height:28px;border-radius:14px;border:0;background:var(--dv-div);position:relative;cursor:pointer;flex-shrink:0;padding:0}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3);transition:transform .15s}
.sw[aria-checked="true"]{background:var(--dv-pbtn)}
.sw[aria-checked="true"]::after{transform:translateX(18px)}
/* chips */
.chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px}
.chips::-webkit-scrollbar{display:none}
.chips.wrap{flex-wrap:wrap;justify-content:center;overflow:visible}
.chip{min-height:36px;border-radius:18px;border:1px solid var(--dv-div);background:var(--dv-bg);color:var(--dv-text);font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:6px;padding:0 12px;cursor:pointer;white-space:nowrap;flex-shrink:0}
.chip.on{background:var(--dv-tint);border-color:transparent;color:var(--dv-pt)}
/* rows / forms */
.row{display:flex;align-items:center;gap:12px;min-height:52px;border-top:1px solid var(--dv-div);padding:6px 0;flex-wrap:wrap}
.row:first-child{border-top:0}
.row .name{flex:1 1 160px;min-width:0;font-size:14px}
.row .val{font-size:14px;color:var(--dv-text2)}
.row .seg{flex:1 1 100%}
select.sel{font:inherit;font-size:14px;color:var(--dv-text);background:var(--dv-bg2);border:1px solid var(--dv-div);border-radius:8px;min-height:40px;padding:0 8px;max-width:100%;cursor:pointer}
input.time{font:inherit;font-size:14px;color:var(--dv-text);background:var(--dv-bg2);border:1px solid var(--dv-div);border-radius:8px;min-height:40px;padding:0 8px}
.range{display:flex;align-items:center;gap:10px;flex:1 1 200px}
.range input{flex:1;accent-color:var(--dv-pbtn);height:28px}
.range span{font-size:13px;min-width:44px;text-align:right;font-variant-numeric:tabular-nums}
/* map */
.mapbox{position:relative;overflow:hidden;background:var(--dv-mapbg);min-height:0}
.map{position:absolute;inset:0}
.fit{position:absolute;touch-action:none}
.fit img{width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none}
.ov{position:absolute;inset:0;cursor:pointer}
.ov.zone,.ov.spot{cursor:crosshair}
.map-empty{position:absolute;inset:0;display:grid;place-items:center;color:#c9ccd1;font-size:14px;text-align:center;padding:24px}
.map-top{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;pointer-events:none;z-index:2}
.map-bottom{position:absolute;bottom:12px;left:12px;right:12px;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;z-index:2}
.map-top>*,.map-bottom>*{pointer-events:auto}
.mpill{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 14px;border-radius:20px;background:var(--dv-bg);border:1px solid var(--dv-div);font-size:14px;font-weight:500;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.mpill select{border:0;background:transparent;font:inherit;color:inherit;cursor:pointer;min-height:36px}
.hint{font-size:13px;color:var(--dv-text);background:var(--dv-bg);border:1px solid var(--dv-div);border-radius:16px;padding:6px 12px;box-shadow:0 2px 8px rgba(0,0,0,.1);display:inline-flex;align-items:center;gap:8px}
.hint button{border:0;background:none;color:var(--dv-pt);font-weight:500;cursor:pointer;padding:4px}
.pill{position:absolute;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 12px 0 4px;border-radius:15px;background:var(--dv-pbtn);color:#fff;font-size:13px;font-weight:500;border:2px solid rgba(255,255,255,.85);white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer}
.pill b{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.28);display:grid;place-items:center;font-size:12px}
.zbox{position:absolute;border:2px dashed #fff;outline:2px dashed var(--dv-p);outline-offset:-2px;background:color-mix(in srgb,var(--dv-p) 22%,transparent);border-radius:4px;pointer-events:none}
.zbox span{position:absolute;top:-28px;left:0;background:var(--dv-pbtn);color:#fff;font-size:12px;font-weight:500;border-radius:12px;padding:3px 10px;white-space:nowrap}
.spt{position:absolute;width:30px;height:30px;transform:translate(-50%,-50%);border-radius:50%;border:3px solid #fff;background:var(--dv-pbtn);box-shadow:0 0 0 6px color-mix(in srgb,var(--dv-p) 30%,transparent);pointer-events:none}
/* popovers */
.scrim{position:absolute;inset:0;border:0;padding:0;margin:0;background:rgba(0,0,0,.32);z-index:20;cursor:default;width:100%;height:100%}
.popover{position:absolute;z-index:21;top:70px;right:14px;width:min(420px,calc(100% - 28px));max-height:calc(100% - 90px);overflow:auto;background:var(--dv-bg);border:1px solid var(--dv-div);border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.25);padding:6px 0}
.note{display:flex;gap:12px;padding:12px 16px;border-top:1px solid var(--dv-div)}
.note .nic{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;background:var(--dv-warnbg);color:var(--dv-warnt)}
.note.crit .nic{background:var(--dv-errbg);color:var(--dv-errt)}
.menu button{display:flex;align-items:center;gap:14px;width:100%;min-height:52px;border:0;background:none;padding:0 18px;font-size:15px;cursor:pointer;text-align:left}
.menu button:hover{background:var(--dv-bg2)}
.toast{position:absolute;left:12px;right:12px;z-index:3;display:flex;align-items:center;gap:10px;min-height:44px;padding:0 8px 0 14px;border-radius:22px;border:0;background:var(--dv-warnbg);color:var(--dv-text);font-size:13px;cursor:pointer;text-align:left;box-shadow:0 2px 10px rgba(0,0,0,.15)}
.ph .toast{bottom:calc(var(--sheet-h,300px) + 2px)}
.toast.crit{background:var(--dv-errbg)}
.alert{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:var(--dv-warnbg);border:0;width:100%;text-align:left;cursor:pointer;color:var(--dv-text)}
.alert.crit{background:var(--dv-errbg)}
/* levels */
.levels{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px}
.lv{padding:8px 10px;border-radius:8px;background:var(--dv-bg2);font-size:12px;min-width:0}
.lv b{display:block;font-weight:500;margin-top:2px;font-size:13px}
.lv.warn{background:var(--dv-warnbg)}.lv.warn b{color:var(--dv-warnt)}
.lv.err{background:var(--dv-errbg)}.lv.err b{color:var(--dv-errt)}
.lv.ok b{color:var(--dv-ok)}
.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
/* care */
.parts{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.ring{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}
.ring>span{width:52px;height:52px;border-radius:50%;background:var(--dv-bg);display:grid;place-items:center;font-size:15px;font-weight:500;font-variant-numeric:tabular-nums}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px}
.stat b{display:block;font-size:24px;font-weight:400;margin-top:4px}
/* settings */
.cols{columns:340px;column-gap:12px}
.cols>.panel{break-inside:avoid;margin-bottom:12px;display:block}
.grp{padding:6px 18px 10px}
.grp-h{display:flex;align-items:center;gap:10px;padding:12px 0 6px}
.grp-h ha-icon{color:var(--dv-pt)}
/* history */
.hist{display:grid;grid-template-columns:minmax(260px,360px) minmax(0,1fr);gap:12px;height:100%;min-height:0}
.hlist{overflow:auto;padding:8px}
.hitem{display:flex;align-items:center;gap:12px;width:100%;min-height:58px;border:0;border-radius:10px;background:transparent;padding:8px 10px;cursor:pointer;text-align:left}
.hitem:hover{background:var(--dv-bg2)}
.hitem.on{background:var(--dv-tint)}
.himg{background:var(--dv-mapbg);border-radius:10px;position:relative;overflow:hidden;min-height:260px}
.himg img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
.obs{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
.obs figure{margin:0;display:flex;flex-direction:column;gap:6px;font-size:12px}
.obs img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;background:var(--dv-bg2)}
/* remote */
.dpad{position:relative;width:280px;height:280px;border-radius:50%;background:var(--dv-bg2);align-self:center;flex-shrink:0;touch-action:none}
.dpad button{position:absolute;width:72px;height:72px;border-radius:50%;border:0;background:var(--dv-bg);color:var(--dv-text);display:grid;place-items:center;cursor:pointer;box-shadow:0 0 0 1px var(--dv-div),0 2px 6px rgba(0,0,0,.08);user-select:none;-webkit-user-select:none}
.dpad button:active,.dpad button.held{background:var(--dv-tint);color:var(--dv-pt)}
.dpad button ha-icon{--mdc-icon-size:30px}
.dpad .c{background:var(--dv-pbtn);color:#fff}
/* ---------- desktop ---------- */
.desk{display:grid;grid-template-columns:88px minmax(0,1fr) minmax(340px,400px);grid-template-rows:minmax(0,1fr);gap:12px;padding:12px;height:100%}
.desk.v{grid-template-columns:88px minmax(0,1fr)}
.desk.rm{grid-template-columns:88px minmax(0,1fr) minmax(360px,420px)}
.col{display:flex;flex-direction:column;gap:12px;min-width:0;min-height:0}
.col.scroll{overflow:auto}
.col .mapbox{flex:1 1 auto}
.rail{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;overflow:auto}
.rail .me{width:44px;height:44px;border-radius:50%;background:var(--dv-tint);color:var(--dv-pt);display:grid;place-items:center;margin-bottom:10px;flex-shrink:0}
.rail button{width:72px;min-height:58px;border-radius:12px;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--dv-text2);font-size:11px;font-weight:500;cursor:pointer;position:relative;flex-shrink:0}
.rail button:hover{background:var(--dv-bg2);color:var(--dv-text)}
.rail button.on{background:var(--dv-tint);color:var(--dv-pt)}
.rail .badge{top:4px;right:12px}
.view{overflow:auto;min-height:0;min-width:0}
.desk.v .view{display:flex;flex-direction:column}
.desk.v .hist{flex:1 1 auto;height:auto}
.vh{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:4px 4px 12px}
.st{display:flex;align-items:center;gap:18px;padding:14px 14px 14px 20px;flex-wrap:wrap}
.st .meta{display:flex;flex-wrap:wrap;gap:6px 20px;font-size:13px;color:var(--dv-text2)}
.st .meta span{display:inline-flex;align-items:center;gap:6px}
.st .meta ha-icon{--mdc-icon-size:16px}
.st .meta b{color:var(--dv-text);font-weight:500}
.carechip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:var(--dv-warnt);background:var(--dv-warnbg);padding:0 12px;min-height:32px;border-radius:16px;border:0;cursor:pointer}
.carechip.crit{color:var(--dv-errt);background:var(--dv-errbg)}
.carechip ha-icon{--mdc-icon-size:16px}
/* ---------- tablet ---------- */
.tab{display:flex;flex-direction:column;height:100%}
.tab-scroll{flex:1 1 auto;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:12px;min-height:0}
.tab-map{height:clamp(320px,52vh,640px);flex-shrink:0}
.tab-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
.tabs{display:flex;justify-content:space-around;padding:4px 8px;border-top:1px solid var(--dv-div);background:var(--dv-bg);flex-shrink:0}
.tabs button{flex:1 1 0;min-height:60px;border:0;background:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--dv-text2);font-size:12px;font-weight:500;cursor:pointer;position:relative}
.tabs button.on{color:var(--dv-pt)}
.tabs button.on ha-icon{background:var(--dv-tint);border-radius:14px;padding:4px 16px}
.tabs .badge{top:4px;right:calc(50% - 26px)}
/* ---------- phone ---------- */
.ph{position:relative;height:100%;overflow:hidden;background:var(--dv-mapbg)}
.ph .map{top:72px;bottom:var(--sheet-h,300px)}
.ph-top{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:8px;align-items:center;z-index:4}
.spill{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:10px;padding:6px 14px;border-radius:26px;min-height:52px;background:var(--dv-bg);border:1px solid var(--dv-div);box-shadow:0 2px 8px rgba(0,0,0,.12)}
.sheet{position:absolute;left:0;right:0;bottom:0;max-height:74%;overflow:auto;background:var(--dv-bg);border-radius:22px 22px 0 0;box-shadow:0 -6px 24px rgba(0,0,0,.18);padding:0 14px calc(14px + env(safe-area-inset-bottom,0px));z-index:3;display:flex;flex-direction:column;gap:12px}
.grab{align-self:center;width:40px;height:5px;border-radius:3px;background:var(--dv-div);margin-top:8px;flex-shrink:0}
.stabs{display:flex;border-bottom:1px solid var(--dv-div);margin:0 -14px;padding:0 10px;flex-shrink:0}
.stabs button{flex:1 1 0;min-height:44px;border:0;background:none;font-size:14px;font-weight:500;color:var(--dv-text2);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;border-bottom:2px solid transparent;margin-bottom:-1px}
.stabs button.on{color:var(--dv-pt);border-bottom-color:var(--dv-p)}
.stabs ha-icon{--mdc-icon-size:18px}
.summary{display:flex;align-items:center;gap:10px;min-height:48px;padding:0 14px;border-radius:12px;border:0;background:var(--dv-bg2);color:var(--dv-text);font-size:14px;cursor:pointer;text-align:left;width:100%}
.ph.v{background:var(--dv-page);display:flex;flex-direction:column}
.ph-head{display:flex;align-items:center;gap:4px;padding:8px 8px 8px 4px;min-height:60px;background:var(--dv-bg);border-bottom:1px solid var(--dv-div);flex-shrink:0}
.ph.v .view{flex:1 1 auto;padding:12px}
.ph .hist{grid-template-columns:1fr;height:auto}
.ph .dpad{width:250px;height:250px}
.ph .dpad button{width:64px;height:64px}
@media (prefers-reduced-motion:reduce){.sw::after{transition:none}}
`;

  /* ------------------------------------------------------------------ */
  /* Card                                                                */
  /* ------------------------------------------------------------------ */
  class DreameVacuumPanelCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._ui = { view: 'clean', target: null, sel: [], zone: null, spot: null, passes: 1, sheetTab: 'clean', sheetOpen: false, pop: null, hist: 0, room: null, speed: 'normal' };
      this._regions = {};
      this._shellKey = null;
      this._nat = null;
      this._w = 0;
      this._snooze = this._loadSnooze();
      this._onClick = this._onClick.bind(this);
      this._onChange = this._onChange.bind(this);
      this._onDown = this._onDown.bind(this);
      this._onMove = this._onMove.bind(this);
      this._onUp = this._onUp.bind(this);
    }

    /* ---------- Lovelace API ---------- */
    static getStubConfig(hass) {
      const reg = hass?.entities || {};
      const id = Object.keys(hass?.states || {}).find((e) => e.startsWith('vacuum.') && (reg[e]?.platform === 'dreame_vacuum' || hass.states[e].attributes?.device_class === 'dreame_vacuum'))
        || Object.keys(hass?.states || {}).find((e) => e.startsWith('vacuum.'));
      return { entity: id || 'vacuum.my_vacuum' };
    }

    static getConfigForm() {
      const labels = {
        entity: 'Vacuum', map_entity: 'Map camera (optional)', title: 'Title (optional)', layout: 'Layout',
        height: 'Height (CSS, optional)', accent_color: 'Accent color (CSS, optional)', default_target: 'Default cleaning target',
        show_back: 'Show back button', show_menu: 'Show HA menu button', fullscreen: 'Fill the screen in panel views',
        care_warning: 'Care warning at (%)', care_critical: 'Care critical at (%)',
      };
      return {
        schema: [
          { name: 'entity', required: true, selector: { entity: { filter: { domain: 'vacuum', integration: 'dreame_vacuum' } } } },
          { name: 'map_entity', selector: { entity: { filter: { domain: 'camera', integration: 'dreame_vacuum' } } } },
          { name: 'title', selector: { text: {} } },
          {
            type: 'grid', name: '', schema: [
              { name: 'layout', selector: { select: { mode: 'dropdown', options: [
                { value: 'auto', label: 'Auto (by card width)' }, { value: 'desktop', label: 'Desktop' }, { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' }] } } },
              { name: 'default_target', selector: { select: { mode: 'dropdown', options: [{ value: 'all', label: 'All rooms' }, { value: 'rooms', label: 'Rooms' }] } } },
              { name: 'height', selector: { text: {} } },
              { name: 'accent_color', selector: { text: {} } },
              { name: 'show_back', selector: { boolean: {} } },
              { name: 'show_menu', selector: { boolean: {} } },
              { name: 'fullscreen', selector: { boolean: {} } },
              { name: 'care_warning', selector: { number: { min: 0, max: 100, mode: 'box', unit_of_measurement: '%' } } },
              { name: 'care_critical', selector: { number: { min: 0, max: 100, mode: 'box', unit_of_measurement: '%' } } },
            ],
          },
        ],
        computeLabel: (s) => labels[s.name] || s.name,
      };
    }

    setConfig(config) {
      if (!config || !config.entity || !String(config.entity).startsWith('vacuum.')) {
        throw new Error('Set "entity" to your Dreame vacuum, e.g. entity: vacuum.my_robot');
      }
      this._config = { layout: 'auto', fullscreen: true, care_warning: 20, care_critical: 10, default_target: 'all', ...config };
      this._ui.target = this._ui.target || this._config.default_target;
      this._map = null;
      this._sig = null;
      this._shellKey = null;
      this._schedule();
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (!this._config) return;
      if (!this._map || hass.entities !== this._regRef) this._discover();
      const sig = this._signature();
      if (first || sig !== this._sig) {
        this._sig = sig;
        this._schedule();
      }
    }
    get hass() { return this._hass; }

    getCardSize() { return 12; }
    getGridOptions() { return { columns: 'full', rows: 10, min_rows: 6, min_columns: 6 }; }

    connectedCallback() {
      const root = this.shadowRoot;
      root.addEventListener('click', this._onClick);
      root.addEventListener('change', this._onChange);
      root.addEventListener('pointerdown', this._onDown);
      root.addEventListener('pointermove', this._onMove);
      root.addEventListener('pointerup', this._onUp);
      root.addEventListener('pointercancel', this._onUp);
      root.addEventListener('pointerleave', this._onUp, true);
      if (!this._ro) {
        this._ro = new ResizeObserver(() => {
          const w = this.clientWidth;
          if (w > 0) this._w = w;
          const rendered = this._shellKey ? this._shellKey.split(':')[0] : null;
          if (rendered !== this._layout()) this._schedule();
          else { this._applyFs(); this._fit(); }
        });
      }
      this._ro.observe(this);
      this._onWin = this._onWin || (() => this._applyFs());
      window.addEventListener('resize', this._onWin);
      window.visualViewport && window.visualViewport.addEventListener('resize', this._onWin);
      this._schedule();
      // HA lays out its header after the card connects, so measure again once it settles.
      this._hTimer = setTimeout(this._onWin, 400);
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._onWin);
      window.visualViewport && window.visualViewport.removeEventListener('resize', this._onWin);
      clearTimeout(this._hTimer);
      this._unlockScroll();
      this._ro && this._ro.disconnect();
      this._sheetRO && this._sheetRO.disconnect();
      this._stopHold();
    }

    /* ---------- discovery ---------- */
    _discover() {
      const h = this._hass;
      const vid = this._config.entity;
      const obj = vid.split('.')[1];
      const reg = h.entities || {};
      this._regRef = h.entities;
      const dev = reg[vid]?.device_id;
      let ids = dev ? Object.keys(reg).filter((id) => reg[id].device_id === dev) : [];
      if (!ids.length) ids = Object.keys(h.states).filter((id) => (id.split('.')[1] || '').startsWith(obj + '_'));
      const map = {};
      for (const id of ids) {
        const [d, o] = id.split('.');
        const key = o.startsWith(obj + '_') ? o.slice(obj.length + 1) : (reg[id]?.translation_key || o);
        if (!map[`${d}.${key}`]) map[`${d}.${key}`] = id;
      }
      for (const [k, v] of Object.entries(this._config.entities || {})) map[k] = v;
      this._map = map;
      const d = dev && h.devices ? h.devices[dev] : null;
      this._devName = d ? (d.name_by_user || d.name) : null;
      this._camId = this._config.map_entity || map['camera.map'] || null;
      this._tracked = [...new Set([vid, this._camId, ...Object.values(map)].filter(Boolean))];
    }

    _signature() {
      const s = this._hass.states;
      let out = '';
      for (const id of this._tracked || []) out += (s[id]?.last_updated || '-') + '|';
      return out;
    }

    /* ---------- state accessors ---------- */
    _id(domain, key) { return this._map?.[`${domain}.${key}`]; }
    _st(domain, key) { const id = this._id(domain, key); return id ? this._hass.states[id] : undefined; }
    _live(domain, key) { const s = this._st(domain, key); return s && !OFF_STATES.includes(s.state) ? s : undefined; }
    get _v() { return this._hass?.states[this._config.entity]; }
    get _a() { return this._v?.attributes || {}; }
    get _cam() { return this._camId ? this._hass.states[this._camId] : undefined; }

    _name(id) {
      const s = this._hass.states[id];
      let n = s?.attributes?.friendly_name || id;
      const dn = this._devName;
      if (dn && n.toLowerCase().startsWith(dn.toLowerCase())) n = n.slice(dn.length).trim();
      return human(n) || id;
    }
    _title() {
      if (this._config.title) return this._config.title;
      if (this._devName) return this._devName;
      const fn = this._a.friendly_name || this._config.entity;
      const parts = fn.split(/\s{2,}/);
      return parts[0];
    }

    _layout() {
      const l = this._config?.layout || 'auto';
      if (l !== 'auto') return l;
      const w = this.clientWidth || this._w || 1200;
      if (w < 600) return 'phone';
      if (w < 1080) return 'tablet';
      return 'desktop';
    }

    _rooms() {
      const cam = this._cam?.attributes?.rooms;
      if (cam && typeof cam === 'object' && Object.keys(cam).length) {
        return Object.values(cam)
          .filter((r) => r.visibility !== 'Hidden')
          .map((r) => ({ id: Number(r.room_id ?? r.id), name: r.custom_name || r.name || `Room ${r.room_id}`, x: r.x, y: r.y, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 }));
      }
      const all = this._a.rooms;
      if (all && typeof all === 'object') {
        const list = all[this._a.selected_map] || Object.values(all)[0] || [];
        return list.map((r) => ({ id: Number(r.id), name: r.name }));
      }
      return [];
    }

    _status() {
      const v = this._v; const a = this._a;
      const st = v.state;
      const running = st === 'cleaning' || st === 'returning' || (a.running && !a.paused);
      const paused = st === 'paused' || (!!a.paused && !running);
      const err = st === 'error' || !!a.has_error && st === 'error';
      const ss = this._live('sensor', 'status');
      let text = ss ? this._fmt(ss) : (human(a.status) || this._fmt(v));
      const room = this._live('sensor', 'current_room')?.state;
      if ((running || paused) && room) text += ` · ${room}`;
      let dot = '';
      if (st === 'error') dot = 'err';
      else if (running) dot = 'ok';
      else if (paused || st === 'returning') dot = 'warn';
      return { running, paused, err, text, dot, state: st };
    }

    _select(key) {
      const s = this._live('select', key);
      if (!s) return null;
      return { id: s.entity_id, value: s.state, options: s.attributes.options || [], so: s };
    }

    /** Translated state text, using Home Assistant's own entity translations when available. */
    _fmt(stateObj, value) {
      const raw = value === undefined ? stateObj?.state : value;
      if (raw === undefined || raw === null) return '';
      let out = '';
      try { out = stateObj && this._hass.formatEntityState ? this._hass.formatEntityState(stateObj, raw) : ''; } catch (e) { out = ''; }
      if (!out || out === raw) out = human(raw);
      return out;
    }

    /** Label for a select option: short form for compact buttons, otherwise translated. */
    _opt(stateObj, o, short = true) {
      const full = this._fmt(stateObj, o);
      return short ? (SHORT[o] || SHORT[full] || full) : full;
    }

    /** Numeric sensor with its own unit, rounded for display. */
    _measure(key, attrFallback, unitFallback) {
      const s = this._live('sensor', key);
      let v = s ? num(s.state) : num(this._a[attrFallback]);
      if (v === null) return null;
      const unit = s ? (s.attributes.unit_of_measurement || '') : unitFallback;
      v = Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
      return { v, unit, text: `${v.toLocaleString()}${unit ? ` ${unit}` : ''}` };
    }

    /* ---------- care ---------- */
    _consumables() {
      const a = this._a;
      const out = [];
      for (const [k, v] of Object.entries(a)) {
        if (!k.endsWith('_left') || k.endsWith('_time_left') || k === 'drying_left') continue;
        const key = k.slice(0, -5);
        const p = num(v);
        if (p === null) continue;
        const sens = this._live('sensor', `${key}_time_left`);
        const tl = sens ? num(sens.state) : num(a[`${key}_time_left`]);
        const unit = sens?.attributes?.unit_of_measurement || (key === 'silver_ion' ? 'd' : 'h');
        out.push({ key, pct: clamp(p, 0, 100), timeLeft: tl, unit, name: (CONS[key] || [human(key)])[0], icon: (CONS[key] || [0, 'mdi:wrench-outline'])[1] });
      }
      return out;
    }

    _notes(includeSnoozed = false) {
      const a = this._a;
      const warn = Number(this._config.care_warning ?? 20);
      const crit = Number(this._config.care_critical ?? 10);
      const notes = [];
      const faults = a.faults && typeof a.faults === 'object' ? Object.entries(a.faults) : [];
      for (const [code, text] of faults) {
        notes.push({ id: `fault_${code}`, level: 'crit', icon: 'mdi:alert-circle-outline', title: human(text), desc: 'Reported by the robot.', action: this._id('button', 'clear_warning') ? { a: 'press', e: this._id('button', 'clear_warning'), label: 'Clear warning' } : null });
      }
      if (!faults.length && a.error && !/no error/i.test(String(a.error)) && this._v.state === 'error') {
        notes.push({ id: 'error', level: 'crit', icon: 'mdi:alert-circle-outline', title: human(a.error), desc: 'Reported by the robot.', action: null });
      }
      for (const c of this._consumables()) {
        if (c.pct > warn) continue;
        const level = c.pct <= crit ? 'crit' : 'warn';
        const left = c.timeLeft !== null ? `, about ${c.timeLeft} ${c.unit} left` : '';
        notes.push({ id: `cons_${c.key}`, level, icon: c.icon, title: `${c.name} at ${c.pct}%`, desc: c.key === 'detergent' ? `Refill the detergent cartridge soon${left}.` : `Time to clean or replace${left}.`, action: { a: 'reset', v: c.key, label: c.key === 'detergent' ? 'I refilled it' : 'Mark as done' } });
      }
      if (a.low_water_warning && !/no warning/i.test(String(a.low_water_warning))) {
        notes.push({ id: 'low_water', level: 'warn', icon: 'mdi:water-alert-outline', title: human(a.low_water_warning), desc: 'Check the clean water tank.', action: null });
      }
      const tanks = [['dust_bag_status', 'Dust bag'], ['clean_water_tank_status', 'Clean water tank'], ['dirty_water_tank_status', 'Dirty water tank'], ['detergent_status', 'Detergent cartridge']];
      for (const [k, label] of tanks) {
        const v = a[k];
        if (v && !/^(installed|normal|idle|ok)$/i.test(String(v))) notes.push({ id: `tank_${k}`, level: 'warn', icon: 'mdi:home-alert-outline', title: `${label}: ${human(v)}`, desc: 'Check the dock.', action: null });
      }
      const now = Date.now();
      return includeSnoozed ? notes : notes.filter((n) => !(this._snooze[n.id] > now));
    }

    _loadSnooze() { try { return JSON.parse(localStorage.getItem('dvpc-snooze') || '{}'); } catch (e) { return {}; } }
    _saveSnooze() { try { localStorage.setItem('dvpc-snooze', JSON.stringify(this._snooze)); } catch (e) { /* ignore */ } }

    /* ---------- map math ---------- */
    _calib() {
      const cp = this._cam?.attributes?.calibration_points;
      if (!Array.isArray(cp) || cp.length < 3) return null;
      const [p0, p1, p2] = cp;
      const dx1 = p1.vacuum.x - p0.vacuum.x, dy1 = p1.vacuum.y - p0.vacuum.y;
      const dx2 = p2.vacuum.x - p0.vacuum.x, dy2 = p2.vacuum.y - p0.vacuum.y;
      const det = dx1 * dy2 - dx2 * dy1;
      if (!det) return null;
      // Solve map = M * (vac - v0) + m0 using the two difference vectors.
      const mx1 = p1.map.x - p0.map.x, my1 = p1.map.y - p0.map.y;
      const mx2 = p2.map.x - p0.map.x, my2 = p2.map.y - p0.map.y;
      const a = (mx1 * dy2 - mx2 * dy1) / det, b = (mx2 * dx1 - mx1 * dx2) / det;
      const c = (my1 * dy2 - my2 * dy1) / det, d = (my2 * dx1 - my1 * dx2) / det;
      const idet = a * d - b * c;
      return {
        v2m: (x, y) => ({ x: p0.map.x + a * (x - p0.vacuum.x) + b * (y - p0.vacuum.y), y: p0.map.y + c * (x - p0.vacuum.x) + d * (y - p0.vacuum.y) }),
        m2v: (mx, my) => {
          const u = mx - p0.map.x, w = my - p0.map.y;
          return { x: p0.vacuum.x + (d * u - b * w) / idet, y: p0.vacuum.y + (-c * u + a * w) / idet };
        },
      };
    }

    _pctPos(x, y) {
      const cal = this._calib();
      if (!cal || !this._nat) return null;
      const m = cal.v2m(x, y);
      return { l: (m.x / this._nat.w) * 100, t: (m.y / this._nat.h) * 100 };
    }

    _evtToVac(ev) {
      const fit = this.shadowRoot.querySelector('[data-fit]');
      const cal = this._calib();
      if (!fit || !cal || !this._nat) return null;
      const r = fit.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * this._nat.w;
      const py = ((ev.clientY - r.top) / r.height) * this._nat.h;
      const v = cal.m2v(px, py);
      return { x: Math.round(v.x), y: Math.round(v.y), fx: (ev.clientX - r.left) / r.width, fy: (ev.clientY - r.top) / r.height };
    }

    _imgUrl() {
      const p = this._cam?.attributes?.entity_picture;
      if (!p) return null;
      return this._hass.hassUrl ? this._hass.hassUrl(p) : p;
    }

    _fit() {
      const root = this.shadowRoot;
      const box = root.querySelector('[data-map]');
      const fit = root.querySelector('[data-fit]');
      if (!box || !fit || !this._nat) return;
      const lay = this._layout();
      const top = box.querySelector('.map-top');
      const bot = box.querySelector('.map-bottom');
      const padT = lay === 'phone' ? 8 : (top ? top.offsetHeight + 20 : 12);
      const padB = lay === 'phone' ? 8 : (bot ? bot.offsetHeight + 20 : 12);
      const W = box.clientWidth - 24, H = box.clientHeight - padT - padB;
      if (W <= 0 || H <= 0) return;
      const s = Math.min(W / this._nat.w, H / this._nat.h);
      const w = this._nat.w * s, h = this._nat.h * s;
      fit.style.width = `${w}px`;
      fit.style.height = `${h}px`;
      fit.style.left = `${(box.clientWidth - w) / 2}px`;
      fit.style.top = `${padT + (H - h) / 2}px`;
    }

    /* ---------- render pipeline ---------- */
    _schedule() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => { this._raf = null; this._render(); });
    }

    _render() {
      const root = this.shadowRoot;
      if (!this._config || !this._hass) return;
      if (!this._map) this._discover();
      const v = this._v;
      if (!v) {
        root.innerHTML = `<style>${CSS}</style><ha-card class="dv" style="--dv-h:auto;min-height:0"><div class="pad"><b>Dreame Vacuum Panel Card</b><p class="muted">Entity <code>${esc(this._config.entity)}</code> not found.</p></div></ha-card>`;
        this._shellKey = null;
        return;
      }
      const lay = this._layout();
      const view = this._ui.view;
      const key = `${lay}:${view}`;
      if (key !== this._shellKey) {
        this._shellKey = key;
        this._regions = {};
        const h = this._config.height || 'calc(100dvh - var(--header-height, 56px) - 16px)';
        const accent = this._config.accent_color ? `--dvpc-accent:${esc(this._config.accent_color)};` : '';
        root.innerHTML = `<style>${CSS}</style><ha-card class="dv L-${lay}" style="--dv-h:${esc(h)};${accent}">${this._shell(lay, view)}</ha-card>`;
        const img = root.querySelector('[data-img]');
        if (img) {
          img.addEventListener('load', () => {
            this._nat = { w: img.naturalWidth, h: img.naturalHeight };
            this._sampleBg(img);
            this._fit();
            this._renderRegions(true);
          });
          img.addEventListener('error', () => { this._imgSrc = null; });
          this._imgSrc = null;
        }
        const sheet = root.querySelector('.sheet');
        this._sheetRO && this._sheetRO.disconnect();
        if (sheet) {
          this._sheetRO = new ResizeObserver(() => this._placeSheet());
          this._sheetRO.observe(sheet);
        }
      }
      this._applyFs();
      this._renderRegions();
      const img = root.querySelector('[data-img]');
      const url = this._imgUrl();
      if (img && url && url !== this._imgSrc) { this._imgSrc = url; img.src = url; }
      const empty = root.querySelector('[data-empty]');
      if (empty) empty.hidden = !!url;
      this._placeSheet();
      this._fit();
    }

    /* "App within an app": in a panel view the card leaves HA's flow and pins itself to the
       visible viewport (position:fixed), starting just below HA's header. The page scroller is
       locked while mounted, so there is no height maths to get wrong and nothing to scroll. */
    _scrollers() {
      const out = [];
      for (let n = this.parentElement || this.getRootNode().host; n; n = n.parentElement || (n.getRootNode && n.getRootNode().host)) {
        if (n === document.documentElement) { out.push(document.documentElement); continue; }
        const oy = getComputedStyle(n).overflowY;
        if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') out.push(n);
      }
      return out;
    }

    _fsWanted() {
      const fs = this._config?.fullscreen;
      if (fs === false) return false;
      if (fs === 'force') return true;
      for (let n = this.parentElement || this.getRootNode().host; n; n = n.parentElement || (n.getRootNode && n.getRootNode().host)) {
        if (n.localName === 'hui-panel-view') return true;
        if (/dialog|preview/.test(n.localName)) return false;
      }
      return false;
    }

    _unlockScroll() {
      if (!this._locked) return;
      this._locked.forEach((prev, el) => { el.style.overflow = prev; });
      this._locked = null;
    }

    _applyFs() {
      const card = this.shadowRoot.querySelector('ha-card.dv');
      if (!card || !this.isConnected) return;
      const on = this._fsWanted();
      this.classList.toggle('fs', on);
      card.classList.toggle('fs', on);
      if (!on) { this._unlockScroll(); return; }
      this._locked = this._locked || new Map();
      this._scrollers().forEach((el) => {
        if (this._locked.has(el)) return;
        this._locked.set(el, el.style.overflow);
        el.scrollTop = 0;
        el.style.overflow = 'hidden';
      });
      const r = this.getBoundingClientRect();
      card.style.setProperty('--dv-top', `${Math.max(0, r.top)}px`);
      card.style.setProperty('--dv-left', `${r.left}px`);
      card.style.setProperty('--dv-w', `${r.width}px`);
      const size = `${card.clientWidth}x${card.clientHeight}`;
      if (size !== this._fsSize) { this._fsSize = size; this._fit(); }
    }

    _placeSheet() {
      const root = this.shadowRoot;
      const sheet = root.querySelector('.sheet');
      const ph = root.querySelector('.ph');
      if (!sheet || !ph) return;
      const hgt = sheet.offsetHeight;
      ph.style.setProperty('--sheet-h', `${hgt + 8}px`);
      this._fit();
    }

    _sampleBg(img) {
      try {
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
        const [r, g, b, al] = ctx.getImageData(0, 0, 1, 1).data;
        if (al > 200) this.shadowRoot.querySelector('ha-card')?.style.setProperty('--dv-mapbg', `rgb(${r},${g},${b})`);
      } catch (e) { /* cross-origin or not ready */ }
    }

    _renderRegions(force = false) {
      const root = this.shadowRoot;
      root.querySelectorAll('[data-r]').forEach((el) => {
        const name = el.getAttribute('data-r');
        const html = this._region(name);
        if (force || this._regions[name] !== html) {
          const sc = el.querySelector('.chips');
          const left = sc ? sc.scrollLeft : 0;
          const scrollTop = el.scrollTop;
          el.innerHTML = html;
          this._regions[name] = html;
          const sc2 = el.querySelector('.chips');
          if (sc2) sc2.scrollLeft = left;
          if (scrollTop) el.scrollTop = scrollTop;
        }
      });
      const ov = root.querySelector('[data-r="overlay"]');
      if (ov) ov.className = `ov ${this._ui.view === 'clean' ? this._ui.target : ''}`;
    }

    /* ---------- shells ---------- */
    _mapShell(withChrome = true) {
      return `<section class="panel mapbox" aria-label="Map"><div class="map" data-map>
        <div class="map-empty" data-empty hidden>No map yet. Check the map camera entity (camera.*_map).</div>
        <div class="fit" data-fit><img data-img alt="Vacuum map" draggable="false"><div class="ov" data-r="overlay"></div></div>
        ${withChrome ? '<div class="map-top" data-r="maptop"></div><div class="map-bottom" data-r="mapbottom"></div>' : ''}
      </div></section>`;
    }

    _shell(lay, view) {
      if (lay === 'desktop') {
        if (view === 'clean') {
          return `<div class="desk"><nav class="panel rail" data-r="nav" aria-label="Vacuum sections"></nav>
            <div class="col"><section class="panel" data-r="status"></section>${this._mapShell()}</div>
            <div class="col scroll"><section class="panel pad" data-r="cleaning"></section><section class="panel pad" data-r="dock"></section></div>
            <div data-r="pop"></div></div>`;
        }
        if (view === 'remote') {
          return `<div class="desk rm"><nav class="panel rail" data-r="nav" aria-label="Vacuum sections"></nav>
            <div class="col">${this._mapShell(false)}</div><div class="col scroll"><section class="panel pad" data-r="view"></section></div><div data-r="pop"></div></div>`;
        }
        return `<div class="desk v"><nav class="panel rail" data-r="nav" aria-label="Vacuum sections"></nav><div class="view" data-r="view"></div><div data-r="pop"></div></div>`;
      }
      if (lay === 'tablet') {
        if (view === 'clean') {
          return `<div class="tab"><div class="tab-scroll">
            <section class="panel" data-r="status"></section>
            <div class="tab-map">${this._mapShell().replace('class="panel mapbox"', 'class="panel mapbox" style="height:100%"')}</div>
            <div class="tab-grid"><section class="panel pad" data-r="cleaning"></section><div class="stack"><section class="panel pad" data-r="dock"></section><div data-r="carebanner"></div></div></div>
            </div><nav class="tabs" data-r="nav" aria-label="Vacuum sections"></nav><div data-r="pop"></div></div>`;
        }
        if (view === 'remote') {
          return `<div class="tab"><div class="tab-scroll"><div class="tab-map">${this._mapShell(false).replace('class="panel mapbox"', 'class="panel mapbox" style="height:100%"')}</div><section class="panel pad" data-r="view"></section></div><nav class="tabs" data-r="nav"></nav><div data-r="pop"></div></div>`;
        }
        return `<div class="tab"><div class="tab-scroll" data-r="view"></div><nav class="tabs" data-r="nav" aria-label="Vacuum sections"></nav><div data-r="pop"></div></div>`;
      }
      // phone
      if (view === 'clean') {
        return `<div class="ph">${this._mapShell(false).replace('class="panel mapbox"', 'class="mapbox" style="position:absolute;inset:0;border:0;border-radius:0"')}
          <div class="ph-top" data-r="phtop"></div><div data-r="toast"></div>
          <section class="sheet" data-r="sheet" aria-label="Controls"></section><div data-r="pop"></div></div>`;
      }
      return `<div class="ph v"><header class="ph-head" data-r="phhead"></header><div class="view" data-r="view"></div><div data-r="pop"></div></div>`;
    }

    /* ---------- regions ---------- */
    _region(name) {
      switch (name) {
        case 'nav':
          if (v === 'back') history.back();
          else if (v === 'menu') this.dispatchEvent(new CustomEvent('hass-toggle-menu', { bubbles: true, composed: true }));
          break;
        case 'pop': u.pop = u.pop === v ? null : v; break;
        case 'closepop': u.pop = null; break;
        case 'hist': u.hist = Number(v); break;
        case 'speed': u.speed = v; break;
        case 'snooze': this._snooze[v] = Date.now() + 24 * 3600 * 1000; this._saveSnooze(); break;
        case 'unsnooze': this._snooze = {}; this._saveSnooze(); break;
        case 'run': this._run(); break;
        case 'svc': this._call('vacuum', v, { entity_id: this._config.entity }); break;
        case 'opt': this._call('select', 'select_option', { entity_id: e, option: v }); break;
        case 'toggle': this._call('switch', 'toggle', { entity_id: e }); break;
        case 'press':
          if (el.dataset.confirm && !window.confirm(`Run "${this._name(e)}" now?`)) return;
          this._call('button', 'press', { entity_id: e });
          break;
        case 'reset': this._reset(v); break;
        default: return;
      }
      this._schedule();
    }

    _onChange(ev) {
      const el = ev.target.closest('[data-a]');
      if (!el) return;
      const { a, e } = el.dataset;
      if (a === 'optsel') this._call('select', 'select_option', { entity_id: e, option: el.value });
      else if (a === 'num') this._call('number', 'set_value', { entity_id: e, value: Number(el.value) });
      else if (a === 'time') this._call('time', 'set_value', { entity_id: e, time: `${el.value}:00` });
      else if (a === 'setroom') { this._ui.room = Number(el.value); this._schedule(); }
    }

    _onDown(ev) {
      const hold = ev.target.closest('[data-hold]');
      if (hold) {
        ev.preventDefault();
        this._startHold(hold);
        return;
      }
      const ov = ev.target.closest('[data-r="overlay"]');
      if (!ov || ev.target.closest('[data-a]') || this._ui.view !== 'clean') return;
      const p = this._evtToVac(ev);
      if (!p) return;
      this._drag = { start: p, cur: p, id: ev.pointerId, moved: false };
      if (this._ui.target === 'zone') {
        try { ov.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
        ev.preventDefault();
      }
    }

    _onMove(ev) {
      const d = this._drag;
      if (!d || ev.pointerId !== d.id) return;
      const p = this._evtToVac(ev);
      if (!p) return;
      d.cur = p;
      if (Math.abs(p.fx - d.start.fx) + Math.abs(p.fy - d.start.fy) > 0.01) d.moved = true;
      if (this._ui.target === 'zone' && d.moved) {
        const box = this.shadowRoot.querySelector('[data-live]');
        if (box) {
          box.hidden = false;
          box.style.left = `${Math.min(d.start.fx, p.fx) * 100}%`;
          box.style.top = `${Math.min(d.start.fy, p.fy) * 100}%`;
          box.style.width = `${Math.abs(p.fx - d.start.fx) * 100}%`;
          box.style.height = `${Math.abs(p.fy - d.start.fy) * 100}%`;
        }
      }
    }

    _onUp(ev) {
      if (this._hold && (ev.type !== 'pointerleave' || ev.target.closest?.('[data-hold]'))) this._stopHold();
      const d = this._drag;
      if (!d || (ev.pointerId !== undefined && ev.pointerId !== d.id) || ev.type === 'pointerleave') return;
      this._drag = null;
      const u = this._ui;
      if (u.target === 'zone' && d.moved) {
        const a = d.start, b = d.cur;
        u.zone = [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)];
        if (Math.abs(u.zone[2] - u.zone[0]) < 300 || Math.abs(u.zone[3] - u.zone[1]) < 300) u.zone = null;
      } else if (u.target === 'spot' && !d.moved) {
        u.spot = [d.start.x, d.start.y];
      } else if (u.target === 'rooms' && !d.moved) {
        const hit = this._rooms().filter((r) => r.x0 !== undefined && d.start.x >= Math.min(r.x0, r.x1) && d.start.x <= Math.max(r.x0, r.x1) && d.start.y >= Math.min(r.y0, r.y1) && d.start.y <= Math.max(r.y0, r.y1))
          .sort((r1, r2) => Math.abs((r1.x1 - r1.x0) * (r1.y1 - r1.y0)) - Math.abs((r2.x1 - r2.x0) * (r2.y1 - r2.y0)));
        if (hit.length) {
          const id = hit[0].id;
          u.sel = u.sel.includes(id) ? u.sel.filter((x) => x !== id) : [...u.sel, id];
        }
      } else if (u.target === 'all' && !d.moved) {
        return;
      }
      this._schedule();
    }

    _startHold(btn) {
      this._stopHold();
      const dir = btn.dataset.hold;
      const vel = { slow: 100, normal: 200, fast: 300 }[this._ui.speed] || 200;
      const cmd = { fwd: [0, vel], back: [0, -vel], left: [64, 0], right: [-64, 0] }[dir];
      if (!cmd) return;
      btn.classList.add('held');
      const send = () => this._call('dreame_vacuum', 'vacuum_remote_control_move_step', { entity_id: this._config.entity, rotation: cmd[0], velocity: cmd[1] }, true);
      send();
      this._hold = { btn, t: setInterval(send, 450) };
    }

    _stopHold() {
      if (!this._hold) return;
      clearInterval(this._hold.t);
      this._hold.btn.classList.remove('held');
      this._hold = null;
    }

    /* ---------- actions ---------- */
    _run() {
      const s = this._status();
      const u = this._ui;
      const ent = this._config.entity;
      if (s.running) return this._call('vacuum', 'pause', { entity_id: ent });
      if (s.paused) return this._call('vacuum', 'start', { entity_id: ent });
      if (u.target === 'rooms' && u.sel.length) {
        return this._call('dreame_vacuum', 'vacuum_clean_segment', { entity_id: ent, segments: u.sel, repeats: u.passes });
      }
      if (u.target === 'zone' && u.zone) {
        return this._call('dreame_vacuum', 'vacuum_clean_zone', { entity_id: ent, zone: [u.zone], repeats: u.passes });
      }
      if (u.target === 'spot' && u.spot) {
        return this._call('dreame_vacuum', 'vacuum_clean_spot', { entity_id: ent, points: [u.spot], repeats: u.passes });
      }
      if (u.target === 'all') return this._call('vacuum', 'start', { entity_id: ent });
      return null;
    }

    _reset(key) {
      const btn = this._id('button', `reset_${RESET_NAME[key] || key}`) || this._id('button', `reset_${key}`);
      if (btn) return this._call('button', 'press', { entity_id: btn });
      return this._call('dreame_vacuum', 'vacuum_reset_consumable', { entity_id: this._config.entity, consumable: RESET_NAME[key] || key });
    }

    async _call(domain, service, data, quiet = false) {
      try {
        await this._hass.callService(domain, service, data);
      } catch (err) {
        if (!quiet) {
          this.dispatchEvent(new CustomEvent('hass-notification', { detail: { message: `${domain}.${service} failed: ${err?.message || err}` }, bubbles: true, composed: true }));
        }
        // eslint-disable-next-line no-console
        console.warn(`[${TAG}]`, domain, service, err);
      }
    }
  }

  if (!customElements.get(TAG)) customElements.define(TAG, DreameVacuumPanelCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === TAG)) {
    window.customCards.push({
      type: TAG,
      name: 'Dreame Vacuum Panel Card',
      description: 'Full-screen control for Dreame robot vacuums: map, rooms, zones, dock, care alerts and settings. Adapts to desktop, tablet and phone.',
      preview: false,
      documentationURL: 'https://github.com/The-Croz/dreame-vacuum-panel-card',
    });
  }
  // eslint-disable-next-line no-console
  console.info(`%c DREAME-VACUUM-PANEL-CARD %c v${VERSION} `, 'background:#0a76b8;color:#fff;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e8eef3;color:#0a76b8;border-radius:0 3px 3px 0;padding:2px 4px');
})();
