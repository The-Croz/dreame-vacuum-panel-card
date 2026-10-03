/*!
 * Dreame Vacuum Panel Card
 * A panel-mode Lovelace card for the Tasshack/dreame-vacuum integration.
 * Desktop, tablet and phone layouts in one card. MIT License.
 */
(() => {
  const VERSION = '0.2.1';
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
  // The integration's suction keys differ from the Dreame app's names (strong = Turbo, turbo = Max).
  const SUCTION_APP = { quiet: 'Quiet', standard: 'Standard', strong: 'Turbo', turbo: 'Max' };
  const WET_NAMES = ['Slightly dry', 'Moist', 'Wet'];
  const WET_SHORT = ['Dry', 'Moist', 'Wet'];
  const WET_TOPS = [5, 26]; // last level of the first two bands on a 1-32 scale (observed from the robot)
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
.btn.stopwash{border-color:var(--dv-err);color:var(--dv-errt);background:var(--dv-errbg);min-height:48px}
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
.wet{width:100%;accent-color:var(--dv-pbtn);height:28px;margin:0}
.thirds{display:flex;font-size:12px;color:var(--dv-text2);text-align:center;margin-top:2px}
.thirds span{min-width:0;border-top:3px solid var(--dv-div);padding-top:3px}
.thirds span+span{margin-left:2px}
.thirds .on{border-top-color:var(--dv-p)}
.thirds .on{color:var(--dv-pt);font-weight:600}
.range span{font-size:13px;min-width:44px;text-align:right;font-variant-numeric:tabular-nums}
/* map */
.mapbox{position:relative;overflow:hidden;background:var(--dv-mapbg);min-height:0}
.map{position:absolute;inset:0}
.fit{position:absolute;touch-action:none;visibility:hidden}
.fit.ready{visibility:visible}
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
.dpad{--b:72px;position:relative;width:280px;height:280px;border-radius:50%;background:var(--dv-bg2);align-self:center;flex-shrink:0;touch-action:none}
.dpad button{position:absolute;width:var(--b);height:var(--b);border-radius:50%;border:0;background:var(--dv-bg);color:var(--dv-text);display:grid;place-items:center;cursor:pointer;box-shadow:0 0 0 1px var(--dv-div),0 2px 6px rgba(0,0,0,.08);user-select:none;-webkit-user-select:none}
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
.rail .hanav{display:flex;flex-direction:column;align-items:center;gap:2px;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid var(--dv-div);flex-shrink:0}
.rail .hanav .hab,.tabs .hanav .hab{width:44px;min-height:44px;height:44px;border-radius:50%;gap:0;flex:0 0 auto}
.tabs .hanav{display:flex;align-items:center;gap:2px;padding-right:6px;margin-right:4px;border-right:1px solid var(--dv-div);flex-shrink:0}
.tabs .hanav .hab:hover{background:var(--dv-bg2);color:var(--dv-text)}
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
.ph .dpad{--b:64px;width:250px;height:250px}
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
        show_water_tank_draining: 'Show Water Tank Draining (needs drain & refill kit)', show_auto_water_refilling: 'Show Auto Water Refilling (needs drain & refill kit)',
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
              { name: 'show_water_tank_draining', selector: { boolean: {} } },
              { name: 'show_auto_water_refilling', selector: { boolean: {} } },
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
      this._config = { layout: 'auto', fullscreen: true, show_water_tank_draining: false, show_auto_water_refilling: false, care_warning: 20, care_critical: 10, default_target: 'all', ...config };
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

    // HA sets preview=true while the dashboard is in edit mode (and in the card editor).
    // Full screen steps aside then, so the page scrolls and the Edit button is reachable.
    set preview(v) {
      const on = !!v;
      if (on === !!this._preview) return;
      this._preview = on;
      if (this._config) this._schedule();
    }
    get preview() { return !!this._preview; }

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
      // A held drive button must never outlive the page: stop if it is hidden, blurred or unloaded.
      this._onHide = this._onHide || (() => this._stopHold());
      document.addEventListener('visibilitychange', this._onHide);
      window.addEventListener('blur', this._onHide);
      window.addEventListener('pagehide', this._onHide);
      window.addEventListener('resize', this._onWin);
      window.visualViewport && window.visualViewport.addEventListener('resize', this._onWin);
      this._schedule();
      // HA lays out its header after the card connects, so measure again once it settles.
      this._hTimer = setTimeout(this._onWin, 400);
    }

    disconnectedCallback() {
      document.removeEventListener('visibilitychange', this._onHide);
      window.removeEventListener('blur', this._onHide);
      window.removeEventListener('pagehide', this._onHide);
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
      const fl = this._dockFlags();
      if (fl.washingPaused) text = 'Mop wash paused';
      else if (fl.washing) text = 'Washing mops';
      const room = this._live('sensor', 'current_room')?.state;
      if ((running || paused) && room) text += ` · ${room}`;
      let dot = '';
      if (st === 'error') dot = 'err';
      else if (fl.washingPaused) dot = 'warn';
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
      const opts = stateObj?.attributes?.options;
      if (/_suction_level$/.test(stateObj?.entity_id || '') && SUCTION_APP[raw] && Array.isArray(opts) && !opts.includes('max')) out = SUCTION_APP[raw];
      return out;
    }

    /** Label for a select option: short form for compact buttons, otherwise translated. */
    _opt(stateObj, o, short = true) {
      const full = this._fmt(stateObj, o);
      return short ? (SHORT[o] || SHORT[full] || full) : full;  // suction keys are absent from SHORT on purpose
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
      fit.classList.add('ready');
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
        root.innerHTML = `<style>${CSS}</style><ha-card class="dv L-${lay}${this._fsGeo && this._fsWanted() ? ' fs' : ''}" style="--dv-h:${esc(h)};${accent}${this._fsGeo && this._fsWanted() ? `--dv-top:${this._fsGeo.top}px;--dv-left:${this._fsGeo.left}px;--dv-w:${this._fsGeo.width}px;` : ''}">${this._shell(lay, view)}</ha-card>`;
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
      this._applyFs(false); // reuse cached geometry so a rebuilt shell is born in place
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
      if (fs === false || this._preview) return false;
      for (let n = this.parentElement || this.getRootNode().host; n; n = n.parentElement || (n.getRootNode && n.getRootNode().host)) {
        if (/dialog|preview|hui-card-options|edit-mode/.test(n.localName)) return false;
      }
      if (fs === 'force') return true;
      for (let n = this.parentElement || this.getRootNode().host; n; n = n.parentElement || (n.getRootNode && n.getRootNode().host)) {
        if (n.localName === 'hui-panel-view') return true;
      }
      return false;
    }

    _unlockScroll() {
      if (!this._locked) return;
      this._locked.forEach((prev, el) => { el.style.overflow = prev; });
      this._locked = null;
    }

    _applyFs(measure = true) {
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
      if (measure || !this._fsGeo) {
        const r = this.getBoundingClientRect();
        this._fsGeo = { top: Math.max(0, r.top), left: r.left, width: r.width };
      }
      const g = this._fsGeo;
      card.style.setProperty('--dv-top', `${g.top}px`);
      card.style.setProperty('--dv-left', `${g.left}px`);
      card.style.setProperty('--dv-w', `${g.width}px`);
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
        case 'nav': return this._nav();
        case 'status': return this._statusBlock();
        case 'cleaning': return this._cleaningBlock();
        case 'dock': return this._dockBlock(false);
        case 'carebanner': return this._careBanner();
        case 'overlay': return this._overlay();
        case 'maptop': return this._mapTop();
        case 'mapbottom': return this._mapBottom();
        case 'pop': return this._pop();
        case 'phtop': return this._phoneTop();
        case 'toast': return this._toast();
        case 'sheet': return this._sheet();
        case 'phhead': return this._phoneHead();
        case 'view': return this._viewBody();
        default: return '';
      }
    }

    _views() {
      return [
        ['clean', 'Clean', 'mdi:robot-vacuum'],
        ['dock', 'Dock', 'mdi:home-lightning-bolt-outline'],
        ['care', 'Care', 'mdi:wrench-outline'],
        ['settings', 'Settings', 'mdi:tune-variant'],
        ['history', 'History', 'mdi:history'],
        ['remote', 'Remote', 'mdi:gamepad-variant-outline'],
      ];
    }

    _nav() {
      const n = this._notes().length;
      const lay = this._layout();
      const items = this._views().map(([id, label, icon]) => {
        const on = this._ui.view === id;
        const badge = id === 'care' && n ? `<span class="badge">${n}</span>` : '';
        return `<button class="${on ? 'on' : ''}" data-a="view" data-v="${id}" ${on ? 'aria-current="page"' : ''}>${ic(icon)}<span>${label}</span>${badge}</button>`;
      }).join('');
      const ha = this._haNav();
      if (lay === 'desktop') return `${ha ? `<div class="hanav">${ha}</div>` : ''}<div class="me" title="${esc(this._title())}">${ic('mdi:robot-vacuum')}</div>${items}`;
      return ha ? `<div class="hanav">${ha}</div>${items}` : items;
    }

    // Back / HA-menu buttons for kiosk mode (HA header hidden). Shared by every layout.
    _haNav(cls = 'hab') {
      const c = this._config;
      return `${c.show_back ? `<button class="${cls}" data-a="nav" data-v="back" aria-label="Back">${ic('mdi:arrow-left')}</button>` : ''}${c.show_menu ? `<button class="${cls}" data-a="nav" data-v="menu" aria-label="Open Home Assistant menu">${ic('mdi:menu')}</button>` : ''}`;
    }

    _battery() {
      const b = num(this._a.battery ?? this._live('sensor', 'battery_level')?.state);
      if (b === null) return { v: null, icon: 'mdi:battery-unknown' };
      const step = clamp(Math.round(b / 10) * 10, 0, 100);
      const charging = this._a.charging || this._v.state === 'docked' && b < 100;
      const icon = step === 100 ? 'mdi:battery' : step === 0 ? 'mdi:battery-outline' : `mdi:battery${charging ? '-charging' : ''}-${step}`;
      return { v: b, icon };
    }

    _runButton(cls = 'btn pri', extra = '') {
      const s = this._status();
      const u = this._ui;
      let label, icon = 'mdi:play', dis = false;
      if (s.running) { label = 'Pause'; icon = 'mdi:pause'; }
      else if (s.paused) { label = 'Resume'; }
      else {
        const n = u.sel.length;
        if (u.target === 'rooms') { label = n ? `Clean ${n} room${n === 1 ? '' : 's'}` : 'Pick rooms'; dis = !n; }
        else if (u.target === 'zone') { label = u.zone ? 'Clean zone' : 'Draw a zone'; dis = !u.zone; }
        else if (u.target === 'spot') { label = u.spot ? 'Spot clean' : 'Tap the map'; dis = !u.spot; }
        else label = 'Clean all';
      }
      return `<button class="${cls}" data-a="run" ${dis ? 'disabled' : ''} ${extra}>${ic(icon)}${label}</button>`;
    }

    _careChip() {
      const notes = this._notes();
      if (!notes.length) return '';
      const crit = notes.some((x) => x.level === 'crit');
      return `<button class="carechip ${crit ? 'crit' : ''}" data-a="pop" data-v="care">${ic('mdi:bell-alert-outline')}${notes.length} care ${notes.length === 1 ? 'alert' : 'alerts'}</button>`;
    }

    _statusBlock() {
      const s = this._status();
      const a = this._a;
      const bat = this._battery();
      const prog = num(a.cleaning_progress);
      const area = this._measure('cleaned_area', 'cleaned_area', 'm²');
      const time = this._measure('cleaning_time', 'cleaning_time', 'min');
      const ssel = this._select('suction_level');
      const hsel = this._select('mop_pad_humidity') || this._select('water_volume');
      const suction = ssel ? this._opt(ssel.so, ssel.value, false) : (a.suction_level || '');
      const hum = this._wet() ? this._wet().name : (hsel ? this._opt(hsel.so, hsel.value, false) : '');
      const lay = this._layout();
      const showProg = (s.running || s.paused) && prog !== null;
      return `<div class="st">
        <div class="stack-s grow">
          <div class="rowf" style="flex-wrap:wrap">
            <h1 class="h" style="font-size:20px">${esc(this._title())}</h1>
            <span class="rowf small muted"><span class="dot ${s.dot}"></span>${esc(s.text)}</span>
            <span class="grow"></span>${this._careChip()}
          </div>
          ${showProg ? `<div class="rowf"><div class="bar grow"><i style="width:${clamp(prog, 0, 100)}%"></i></div><span class="small" style="font-variant-numeric:tabular-nums">${prog}%</span></div>` : ''}
          <div class="meta">
            ${bat.v !== null ? `<span>${ic(bat.icon)}<b>${bat.v}%</b> battery</span>` : ''}
            ${area ? `<span>${ic('mdi:texture-box')}<b>${esc(area.text)}</b> ${s.running || s.paused ? 'cleaned' : 'last run'}</span>` : ''}
            ${time ? `<span>${ic('mdi:timer-outline')}<b>${esc(time.text)}</b></span>` : ''}
            ${lay === 'desktop' && suction ? `<span>${ic('mdi:fan')}${esc(suction)}${hum ? ` · ${esc(hum)}` : ''}</span>` : ''}
          </div>
        </div>
        <div class="rowf">
          <button class="ibtn" data-a="svc" data-v="locate" aria-label="Locate robot" title="Locate">${ic('mdi:map-marker-radius-outline')}</button>
          <button class="ibtn" data-a="svc" data-v="return_to_base" aria-label="Send to dock" title="Send to dock">${ic('mdi:home-import-outline')}</button>
          <button class="ibtn" data-a="svc" data-v="stop" aria-label="Stop" title="Stop">${ic('mdi:stop')}</button>
          ${this._runButton('btn pri', 'style="min-width:150px;margin-left:6px"')}
        </div>
      </div>`;
    }

    _seg(sel, opts = {}) {
      if (!sel || !sel.options.length) return '';
      const label = opts.label ? `<span class="lbl">${esc(opts.label)}</span>` : '';
      if (sel.options.length > (opts.max || 4)) {
        return `<div class="stack-s">${label}<select class="sel" data-a="optsel" data-e="${sel.id}" aria-label="${esc(opts.label || '')}">${sel.options.map((o) => `<option value="${esc(o)}" ${o === sel.value ? 'selected' : ''}>${esc(this._opt(sel.so, o, false))}</option>`).join('')}</select></div>`;
      }
      const btns = sel.options.map((o) => {
        const on = o === sel.value;
        const icon = opts.icons && MODE_ICON[o] ? ic(MODE_ICON[o]) : '';
        return `<button class="${on ? 'on' : ''}" aria-pressed="${on}" data-a="opt" data-e="${sel.id}" data-v="${esc(o)}" title="${esc(this._opt(sel.so, o, false))}" ${opts.icons ? 'style="min-height:58px"' : ''}>${icon}${esc(this._opt(sel.so, o))}</button>`;
      }).join('');
      return `<div class="stack-s">${label}<div class="seg ${opts.dis ? 'dis' : ''}" role="group" aria-label="${esc(opts.label || '')}">${btns}</div></div>`;
    }

    _switchRow(key, title, sub, icon) {
      const s = this._live('switch', key);
      if (!s) return '';
      const on = s.state === 'on';
      return `<div class="rowf" style="min-height:48px">${icon ? ic(icon, 'style="color:var(--dv-text2)"') : ''}<div class="grow"><div style="font-size:14px;font-weight:500">${esc(title)}</div>${sub ? `<div class="xs muted">${esc(sub)}</div>` : ''}</div>
        <button class="sw" role="switch" aria-checked="${on}" aria-label="${esc(title)}" data-a="toggle" data-e="${s.entity_id}"></button></div>`;
    }

    /** Wetness slider (1-32) split into thirds named like the select it replaces. */
    _wet() {
      const st = this._live('number', 'wetness_level');
      if (!st) return null;
      const min = Number(st.attributes.min ?? 1), max = Number(st.attributes.max ?? 32);
      const v = Number(st.state);
      const std = min === 1 && max === 32;
      const tops = std ? WET_TOPS : [min + Math.ceil((max - min + 1) / 3) - 1, min + Math.ceil(2 * (max - min + 1) / 3) - 1];
      const third = v <= tops[0] ? 0 : v <= tops[1] ? 1 : 2;
      const sizes = [tops[0] - min + 1, tops[1] - tops[0], max - tops[1]];
      // The robot decides where the level bands start (observed: not exact thirds), so prefer
      // the humidity select, which the integration derives from the same value.
      const hs = this._live('select', 'mop_pad_humidity');
      const idx = hs ? ['slightly_dry', 'moist', 'wet'].indexOf(hs.state) : -1;
      const band = idx >= 0 ? idx : third;
      return { id: st.entity_id, v, min, max, step: st.attributes.step ?? 1, third: band, name: WET_NAMES[band], sizes };
    }

    _wetControl(dis) {
      const w = this._wet();
      if (!w) return '';
      return `<div class="stack-s"><div class="between"><span class="lbl">Wetness</span><span class="small muted">${esc(w.name)} · ${w.v}</span></div>
        <div class="${dis ? 'dis' : ''}" style="${dis ? 'opacity:.5;pointer-events:none' : ''}"><input class="wet" type="range" min="${w.min}" max="${w.max}" step="${w.step}" value="${w.v}" data-a="num" data-e="${w.id}" aria-label="Wetness" aria-valuetext="${esc(w.name)}" ${dis ? 'disabled' : ''}>
        <div class="thirds">${WET_SHORT.map((n, i) => `<span class="${i === w.third ? 'on' : ''}" style="flex:${w.sizes[i]} 1 0">${n}</span>`).join('')}</div></div></div>`;
    }

    _cleaningControls() {
      const genius = this._select('cleangenius');
      const geniusOn = genius && !/^off$/i.test(genius.value);
      const custom = this._live('switch', 'customized_cleaning')?.state === 'on';
      const manualDis = geniusOn || custom;
      const parts = [];
      const toggles = [];
      if (genius) toggles.push(this._seg(genius, { label: 'CleanGenius' }));
      const cust = this._switchRow('customized_cleaning', 'Per-room settings', 'Use each room’s saved preferences', 'mdi:view-grid-outline');
      if (cust) toggles.push(cust);
      if (toggles.length) parts.push(`<div class="stack-s">${toggles.join('')}</div>`);
      parts.push(this._seg(this._select('cleaning_mode'), { label: 'Mode', icons: true }));
      parts.push(this._seg(this._select('suction_level'), { label: 'Suction', dis: manualDis }));
      parts.push(this._wetControl(manualDis) || this._seg(this._select('mop_pad_humidity') || this._select('water_volume'), { label: this._select('mop_pad_humidity') ? 'Mop humidity' : 'Water volume', dis: manualDis }));
      parts.push(this._seg(this._select('cleaning_route'), { label: 'Route', dis: manualDis }));
      if (this._ui.target !== 'all') {
        parts.push(`<div class="stack-s"><span class="lbl">Passes</span><div class="seg" role="group" aria-label="Passes">${[1, 2, 3].map((p) => `<button class="${this._ui.passes === p ? 'on' : ''}" aria-pressed="${this._ui.passes === p}" data-a="passes" data-v="${p}">${p}×</button>`).join('')}</div></div>`);
      }
      if (manualDis) parts.push(`<div class="xs muted">${geniusOn ? 'CleanGenius is choosing suction, water and route.' : 'Per-room settings are on, so each room uses its own settings.'}</div>`);
      return parts.filter(Boolean).join('');
    }

    _scopeText() {
      const u = this._ui;
      const rooms = this._rooms();
      if (u.target === 'rooms') return `${u.sel.length} of ${rooms.length} rooms`;
      if (u.target === 'zone') return u.zone ? '1 zone' : 'No zone yet';
      if (u.target === 'spot') return u.spot ? '1 spot' : 'No spot yet';
      return 'Whole map';
    }

    _cleaningBlock() {
      return `<div class="stack" style="gap:16px"><div class="between"><h2 class="h">Cleaning</h2><span class="small muted">${esc(this._scopeText())}</span></div>${this._cleaningControls()}</div>`;
    }

    /* On Beep-0 the `washing` attribute stays false during a mop wash; the reliable signal is the
       `vacuum_state` attribute (washing / washing_paused), while HA's own state reads cleaning / paused. */
    _dockFlags() {
      const a = this._a;
      const vs = String(a.vacuum_state || '');
      const washingPaused = !!a.washing_paused || vs === 'washing_paused';
      const washing = !washingPaused && (!!a.washing || vs === 'washing');
      const drying = !!a.drying || vs === 'drying';
      return { washing, washingPaused, drying, busy: washing || washingPaused || drying };
    }

    _dockState() {
      const a = this._a;
      const f = this._dockFlags();
      if (f.washingPaused) return 'Mop wash paused';
      if (f.washing) return 'Washing mops';
      if (f.drying) {
        const left = num(a.drying_left ?? this._live('sensor', 'drying_left')?.state);
        return `Drying mops${left ? ` · ${left} min left` : ''}`;
      }
      const ae = this._live('sensor', 'auto_empty_status');
      if (ae && !/idle/i.test(ae.state)) return this._fmt(ae);
      if (!ae && a.auto_empty_status && !/idle/i.test(a.auto_empty_status)) return human(a.auto_empty_status);
      const base = this._live('sensor', 'self_wash_base_status');
      if (base && !/idle/i.test(base.state)) return this._fmt(base);
      return a.docked || this._v.state === 'docked' ? 'Ready · robot docked' : 'Ready';
    }

    _levels() {
      const a = this._a;
      const lv = [];
      const tank = (k, label) => {
        const v = a[k];
        if (v === undefined) return;
        const ok = /^(installed|normal|ok)$/i.test(String(v));
        lv.push(`<div class="lv ${ok ? 'ok' : 'warn'}"><span class="muted">${label}</span><b>${ok ? 'OK' : esc(human(v))}</b></div>`);
      };
      if (a.low_water_warning && !/no warning/i.test(a.low_water_warning)) lv.push(`<div class="lv warn"><span class="muted">Clean water</span><b>${esc(human(a.low_water_warning))}</b></div>`);
      else tank('clean_water_tank_status', 'Clean water');
      tank('dirty_water_tank_status', 'Dirty water');
      tank('dust_bag_status', 'Dust bag');
      const det = num(a.detergent_left);
      if (det !== null) lv.push(`<div class="lv ${det <= (this._config.care_warning ?? 20) ? 'warn' : ''}"><span class="muted">Detergent</span><b>${det}%</b></div>`);
      return lv.length ? `<div class="levels">${lv.join('')}</div>` : '';
    }

    _dockActions() {
      const a = this._a;
      const acts = [];
      const empty = this._id('button', 'start_auto_empty');
      if (empty) {
        const busy = a.auto_empty_status && !/idle/i.test(a.auto_empty_status);
        acts.push(`<button class="tile ${busy ? 'on' : ''}" data-a="press" data-e="${empty}" ${busy ? 'disabled' : ''}>${ic('mdi:delete-empty-outline')}${busy ? 'Emptying…' : 'Empty bin'}</button>`);
      }
      const wash = this._id('button', 'self_clean') || this._id('button', 'start_washing');
      const fl = this._dockFlags();
      if (wash) acts.push(`<button class="tile ${fl.washing || fl.washingPaused ? 'on' : ''}" data-a="press" data-e="${wash}" aria-pressed="${fl.washing || fl.washingPaused}">${ic('mdi:water-sync')}${fl.washingPaused ? 'Resume wash' : fl.washing ? 'Pause wash' : 'Wash mops'}</button>`);
      const dry = this._id('button', 'manual_drying') || this._id('button', 'start_drying');
      if (dry) acts.push(`<button class="tile ${a.drying ? 'on' : ''}" data-a="press" data-e="${a.drying && this._id('button', 'stop_drying') ? this._id('button', 'stop_drying') : dry}" aria-pressed="${!!a.drying}">${ic('mdi:heat-wave')}${a.drying ? 'Stop drying' : 'Dry mops'}</button>`);
      // Pause/Resume is one toggle button, so a running or paused wash gets its own clear Stop.
      // vacuum.stop ends the wash task (confirmed on Beep-0); the tile only toggles pause.
      const stopWash = fl.washing || fl.washingPaused
        ? `<button class="btn stopwash" data-a="svc" data-v="stop" style="width:100%;margin-bottom:10px">${ic('mdi:stop-circle-outline')}Stop wash</button>` : '';
      return acts.length ? `${stopWash}<div class="grid3">${acts.join('')}</div>` : stopWash;
    }

    _dockBlock(phone) {
      const a = this._a;
      const prog = a.drying ? num(a.drying_progress) : null;
      return `<div class="stack" style="gap:14px">
        <div class="between"><div class="grow"><h2 class="h">Dock</h2><div class="small muted" style="margin-top:2px">${esc(this._dockState())}</div></div>
          ${this._ui.view === 'dock' ? '' : `<button class="${phone ? 'btn sm' : 'link'}" data-a="view" data-v="dock">Dock settings</button>`}</div>
        ${prog !== null ? `<div class="bar"><i style="width:${clamp(prog, 0, 100)}%"></i></div>` : ''}
        ${this._levels()}
        ${this._dockActions()}
        ${phone ? `<button class="btn" data-a="svc" data-v="return_to_base">${ic('mdi:home-import-outline')}Send robot to dock</button>` : ''}
      </div>`;
    }

    _careBanner() {
      const notes = this._notes();
      if (!notes.length) return '';
      const n = notes[0];
      return `<button class="alert ${n.level === 'crit' ? 'crit' : ''}" data-a="pop" data-v="care">${ic(n.icon, `style="color:var(${n.level === 'crit' ? '--dv-errt' : '--dv-warnt'})"`)}
        <span class="grow"><b style="font-weight:500;font-size:14px;display:block">${esc(n.title)}</b><span class="xs muted">${notes.length > 1 ? `+${notes.length - 1} more care ${notes.length === 2 ? 'alert' : 'alerts'}` : esc(n.desc)}</span></span>${ic('mdi:chevron-right')}</button>`;
    }

    _targets(cls = '') {
      const t = this._ui.target;
      const opts = [['all', 'All rooms'], ['rooms', 'Rooms'], ['zone', 'Zone'], ['spot', 'Spot']];
      return `<div class="seg ${cls}" role="group" aria-label="What to clean">${opts.map(([id, l]) => `<button class="${t === id ? 'on' : ''}" aria-pressed="${t === id}" data-a="target" data-v="${id}" style="font-size:14px">${l}</button>`).join('')}</div>`;
    }

    _chips(wrap) {
      const sel = this._ui.sel;
      const rooms = this._rooms();
      if (!rooms.length) return '<span class="small muted">No rooms found on this map.</span>';
      return `<div class="chips ${wrap ? 'wrap' : ''}">${rooms.map((r) => {
        const i = sel.indexOf(r.id);
        return `<button class="chip ${i >= 0 ? 'on' : ''}" aria-pressed="${i >= 0}" data-a="room" data-v="${r.id}">${i >= 0 ? `${i + 1} · ` : ''}${esc(r.name)}</button>`;
      }).join('')}</div>`;
    }

    _hint() {
      const u = this._ui;
      if (u.target === 'all') return 'Cleans every room on this map';
      if (u.target === 'zone') {
        if (!u.zone) return 'Drag on the map to draw a zone';
        const w = Math.abs(u.zone[2] - u.zone[0]) / 1000, h = Math.abs(u.zone[3] - u.zone[1]) / 1000;
        return `Zone ${this._dim(w, h)}<button data-a="clearsel">Clear</button>`;
      }
      if (u.target === 'spot') return u.spot ? 'Spot placed · tap elsewhere to move it<button data-a="clearsel">Clear</button>' : 'Tap the map to place a spot';
      return '';
    }

    _mapTop() {
      const sm = this._select('selected_map');
      let floor = '';
      if (sm && sm.options.length > 1) floor = `<label class="mpill">${ic('mdi:layers-outline')}<select data-a="optsel" data-e="${sm.id}" aria-label="Floor">${sm.options.map((o) => `<option ${o === sm.value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
      else if (this._a.selected_map) floor = `<span class="mpill">${ic('mdi:layers-outline')}${esc(this._a.selected_map)}</span>`;
      return `${floor}<span></span>`;
    }

    _mapBottom() {
      const u = this._ui;
      const chips = u.target === 'rooms' ? `<div style="max-width:min(780px,100%)">${this._chips(true)}</div>` : `<span class="hint">${this._hint()}</span>`;
      return `${chips}${this._targets('float')}`;
    }

    _overlay() {
      if (this._ui.view !== 'clean' || !this._nat || !this._calib()) return '';
      const u = this._ui;
      let html = '';
      if (u.target === 'rooms') {
        const rooms = this._rooms();
        u.sel.forEach((id, i) => {
          const r = rooms.find((x) => x.id === id);
          if (!r || r.x === undefined) return;
          const p = this._pctPos(r.x, r.y);
          html += `<button class="pill" style="left:${p.l}%;top:${p.t}%" data-a="room" data-v="${r.id}" aria-label="Deselect ${esc(r.name)}"><b>${i + 1}</b>${esc(r.name)}</button>`;
        });
      }
      if (u.target === 'zone' && u.zone) html += this._zoneBox(u.zone);
      if (u.target === 'spot' && u.spot) {
        const p = this._pctPos(u.spot[0], u.spot[1]);
        html += `<div class="spt" style="left:${p.l}%;top:${p.t}%"></div>`;
      }
      html += '<div class="zbox" data-live hidden></div>';
      return html;
    }

    /** Zone size in the user's unit system (map coordinates are millimetres). */
    _dim(wm, hm) {
      const us = this._hass.config?.unit_system;
      if (us?.length === 'mi' || us?.area === 'ft²') return `${(wm * 3.28084).toFixed(1)} × ${(hm * 3.28084).toFixed(1)} ft`;
      return `${wm.toFixed(1)} × ${hm.toFixed(1)} m`;
    }

    _zoneBox(z) {
      const p0 = this._pctPos(z[0], z[1]), p1 = this._pctPos(z[2], z[3]);
      const l = Math.min(p0.l, p1.l), t = Math.min(p0.t, p1.t);
      const w = Math.abs(p1.l - p0.l), h = Math.abs(p1.t - p0.t);
      const mw = Math.abs(z[2] - z[0]) / 1000, mh = Math.abs(z[3] - z[1]) / 1000;
      return `<div class="zbox" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%"><span>${this._dim(mw, mh)} · ${this._ui.passes}×</span></div>`;
    }

    _pop() {
      const p = this._ui.pop;
      if (!p) return '';
      if (p === 'menu') {
        return `<button class="scrim" data-a="closepop" aria-label="Close menu"></button>
          <div class="popover menu" role="menu" style="top:70px">${this._views().filter(([id]) => id !== 'clean').map(([id, l, i]) => `<button role="menuitem" data-a="view" data-v="${id}">${ic(i)}${l}${id === 'care' && this._notes().length ? `<span class="badge" style="position:static;margin-left:auto">${this._notes().length}</span>` : ''}</button>`).join('')}</div>`;
      }
      const notes = this._notes();
      const all = this._notes(true);
      const snoozed = all.length - notes.length;
      return `<button class="scrim" data-a="closepop" aria-label="Close care alerts"></button>
        <section class="popover" role="dialog" aria-label="Care alerts">
          <div class="between" style="padding:8px 16px"><span class="h">Care</span><button class="link" data-a="view" data-v="care">All parts</button></div>
          ${notes.map((n) => `<div class="note ${n.level === 'crit' ? 'crit' : ''}"><span class="nic">${ic(n.icon)}</span><div class="grow">
              <div style="font-size:14px;font-weight:500">${esc(n.title)}</div><div class="small muted" style="margin-top:2px">${esc(n.desc)}</div>
              <div class="rowf" style="margin-top:10px;flex-wrap:wrap">${n.action ? `<button class="btn sm" data-a="${n.action.a}" ${n.action.e ? `data-e="${n.action.e}"` : ''} ${n.action.v ? `data-v="${n.action.v}"` : ''}>${esc(n.action.label)}</button>` : ''}
              <button class="btn sm ghost" data-a="snooze" data-v="${n.id}">Remind me tomorrow</button></div></div></div>`).join('')}
          ${!notes.length ? '<div class="note"><span class="small muted">All parts are in good shape.</span></div>' : ''}
          ${snoozed ? `<div class="note"><span class="xs muted grow">${snoozed} snoozed until tomorrow</span><button class="btn sm ghost" data-a="unsnooze">Show</button></div>` : ''}
        </section>`;
    }

    /* phone */
    _phoneTop() {
      const s = this._status();
      const bat = this._battery();
      const n = this._notes().length;
      const nav = this._haNav('fab');
      return `${nav}<div class="spill"><span class="dot ${s.dot}"></span><div class="grow">
          <div class="ell" style="font-size:14px;font-weight:500">${esc(s.text)}</div>
          <div class="ell xs muted">${esc(this._title())}${bat.v !== null ? ` · ${bat.v}%` : ''}${s.running || s.paused ? (this._measure('cleaned_area', 'cleaned_area', 'm²') ? ` · ${esc(this._measure('cleaned_area', 'cleaned_area', 'm²').text)}` : '') : ''}</div></div></div>
        <button class="fab ${this._ui.pop === 'care' ? 'on' : ''}" data-a="pop" data-v="care" aria-label="Care alerts, ${n} new">${ic('mdi:bell-outline')}${n ? `<span class="badge">${n}</span>` : ''}</button>
        <button class="fab ${this._ui.pop === 'menu' ? 'on' : ''}" data-a="pop" data-v="menu" aria-label="More">${ic('mdi:dots-vertical')}</button>`;
    }

    _toast() {
      if (this._ui.pop) return '';
      // Consumable upkeep (cons_*) lives in the bell badge only; the banner is for faults and problems.
      const notes = this._notes().filter((x) => !x.id.startsWith('cons_'));
      if (!notes.length) return '';
      const n = notes[0];
      return `<button class="toast ${n.level === 'crit' ? 'crit' : ''}" data-a="pop" data-v="care">${ic(n.icon, `style="--mdc-icon-size:18px;color:var(${n.level === 'crit' ? '--dv-errt' : '--dv-warnt'})"`)}
        <span class="grow ell"><b style="font-weight:500">${esc(n.title)}</b>${notes.length > 1 ? `<span class="muted"> · +${notes.length - 1} more</span>` : ''}</span><span style="font-weight:500;padding:0 8px;color:var(${n.level === 'crit' ? '--dv-errt' : '--dv-warnt'})">View</span></button>`;
    }

    _summary() {
      const parts = [];
      const lab = (sel) => (sel ? this._opt(sel.so, sel.value) : '');
      const m = this._select('cleaning_mode'); if (m) parts.push(lab(m));
      const g = this._select('cleangenius');
      if (g && !/^off$/i.test(g.value)) parts.push(`CleanGenius ${lab(g)}`);
      else {
        const su = this._select('suction_level'); if (su) parts.push(lab(su));
        const hu = this._select('mop_pad_humidity') || this._select('water_volume'); if (this._wet()) parts.push(this._wet().name); else if (hu) parts.push(this._opt(hu.so, hu.value, false));
      }
      if (this._ui.target !== 'all') parts.push(`${this._ui.passes}×`);
      return parts.join(' · ');
    }

    _sheet() {
      const u = this._ui;
      const dockTab = u.sheetTab === 'dock';
      const dockShort = this._dockFlags().busy || (this._a.auto_empty_status && !/idle/i.test(this._a.auto_empty_status)) ? 'Busy' : 'Ready';
      const tabs = `<div class="grab"></div><div class="stabs" role="tablist">
        <button role="tab" class="${!dockTab ? 'on' : ''}" aria-selected="${!dockTab}" data-a="sheettab" data-v="clean">${ic('mdi:robot-vacuum')}Clean</button>
        <button role="tab" class="${dockTab ? 'on' : ''}" aria-selected="${dockTab}" data-a="sheettab" data-v="dock">${ic('mdi:home-lightning-bolt-outline')}Dock<span class="xs muted" style="font-weight:400">· ${dockShort}</span></button></div>`;
      if (dockTab) return tabs + this._dockBlock(true);
      const body = [this._targets()];
      if (u.target === 'rooms') body.push(this._chips(false));
      else body.push(`<div class="small muted" style="min-height:24px;display:flex;align-items:center;gap:8px">${this._hint().replace(/<button/g, '<button class="link"')}</div>`);
      if (u.sheetOpen) body.push(`<div class="stack" style="gap:14px">${this._cleaningControls()}</div><button class="btn sm ghost" data-a="sheet" style="align-self:center">${ic('mdi:chevron-down')}Done</button>`);
      else body.push(`<button class="summary" data-a="sheet">${ic('mdi:tune-variant', 'style="color:var(--dv-pt)"')}<span class="grow ell">${esc(this._summary())}</span><span style="font-size:13px;font-weight:500;color:var(--dv-pt)">Adjust</span></button>`);
      body.push(`<div class="rowf">${this._runButton('btn pri', 'style="flex:1;min-height:52px;border-radius:26px;font-size:16px"')}
        <button class="btn sq" style="min-height:52px;width:52px;border-radius:26px" data-a="svc" data-v="stop" aria-label="Stop">${ic('mdi:stop')}</button>
        <button class="btn sq" style="min-height:52px;width:52px;border-radius:26px" data-a="svc" data-v="return_to_base" aria-label="Send to dock">${ic('mdi:home-import-outline')}</button></div>`);
      return tabs + body.join('');
    }

    _phoneHead() {
      const v = this._views().find((x) => x[0] === this._ui.view);
      return `<button class="ibtn" data-a="view" data-v="clean" aria-label="Back">${ic('mdi:arrow-left')}</button><h1 class="h grow" style="font-size:18px">${esc(v ? v[1] : '')}</h1>
        ${this._config.show_menu ? `<button class="ibtn" data-a="nav" data-v="menu" aria-label="Open Home Assistant menu">${ic('mdi:menu')}</button>` : ''}<button class="ibtn" data-a="pop" data-v="care" aria-label="Care alerts">${ic('mdi:bell-outline')}${this._notes().length ? `<span class="badge">${this._notes().length}</span>` : ''}</button>`;
    }

    /* ---------- full views ---------- */
    _viewBody() {
      switch (this._ui.view) {
        case 'dock': return this._dockView();
        case 'care': return this._careView();
        case 'settings': return this._settingsView();
        case 'history': return this._historyView();
        case 'remote': return this._remoteView();
        default: return '';
      }
    }

    _viewHead(title, sub) {
      if (this._layout() === 'phone') return '';
      return `<div class="vh"><div><h1 class="h-xl">${esc(title)}</h1>${sub ? `<div class="small muted" style="margin-top:2px">${esc(sub)}</div>` : ''}</div></div>`;
    }

    _control(id, labelOverride) {
      const s = this._hass.states[id];
      if (!s) return '';
      const d = id.split('.')[0];
      const name = esc(labelOverride || this._name(id));
      const off = d === 'button' ? s.state === 'unavailable' : OFF_STATES.includes(s.state);
      if (d === 'switch') {
        return `<div class="row"><span class="name">${name}</span><button class="sw" role="switch" aria-checked="${s.state === 'on'}" aria-label="${name}" data-a="toggle" data-e="${id}" ${off ? 'disabled' : ''}></button></div>`;
      }
      if (d === 'select') {
        const opts = s.attributes.options || [];
        const labels = opts.map((o) => this._opt(s, o));
        const short = !off && opts.length <= 4 && labels.join('').length <= 34;
        if (short) return `<div class="row"><span class="name">${name}</span><div class="seg" role="group" aria-label="${name}">${opts.map((o, i) => `<button class="${o === s.state ? 'on' : ''}" aria-pressed="${o === s.state}" data-a="opt" data-e="${id}" data-v="${esc(o)}">${esc(labels[i])}</button>`).join('')}</div></div>`;
        return `<div class="row"><span class="name">${name}</span><select class="sel" data-a="optsel" data-e="${id}" aria-label="${name}" ${off ? 'disabled' : ''}>${off ? `<option>${esc(this._fmt(s))}</option>` : opts.map((o) => `<option value="${esc(o)}" ${o === s.state ? 'selected' : ''}>${esc(this._opt(s, o, false))}</option>`).join('')}</select></div>`;
      }
      if (d === 'number') {
        const at = s.attributes;
        const unit = at.unit_of_measurement || '';
        return `<div class="row"><span class="name">${name}</span><label class="range"><input type="range" min="${at.min ?? 0}" max="${at.max ?? 100}" step="${at.step ?? 1}" value="${esc(s.state)}" data-a="num" data-e="${id}" aria-label="${name}" ${off ? 'disabled' : ''}><span>${esc(this._numLabel(s.state, unit))}</span></label></div>`;
      }
      if (d === 'time') {
        return `<div class="row"><span class="name">${name}</span><input class="time" type="time" value="${esc(String(s.state).slice(0, 5))}" data-a="time" data-e="${id}" aria-label="${name}" ${off ? 'disabled' : ''}></div>`;
      }
      if (d === 'button') {
        const key = id.split('.')[1];
        const risky = DESTRUCTIVE.some((k) => key.endsWith(k));
        return `<div class="row"><span class="name">${name}</span><button class="btn sm" data-a="press" data-e="${id}" ${risky ? 'data-confirm="1"' : ''} ${off ? 'disabled' : ''}>Run</button></div>`;
      }
      if (d === 'sensor' || d === 'binary_sensor') {
        const u = s.attributes.unit_of_measurement || '';
        return `<div class="row"><span class="name">${name}</span><span class="val">${esc(this._fmt(s))}${u && !this._hass.formatEntityState ? ` ${esc(u)}` : ''}</span></div>`;
      }
      return '';
    }

    /* HA converts sensor units to the user's unit system, but number entities keep the
       integration's native unit. Convert area for display only; the slider stays native. */
    _numLabel(v, unit) {
      const us = this._hass.config?.unit_system;
      if (unit === 'm²' && (us?.area === 'ft²' || us?.length === 'mi')) return `${Math.round(Number(v) * 10.7639)} ft²`;
      return `${v}${unit}`;
    }

    _group(title, icon, ids) {
      const rows = ids.map((id) => this._control(id)).filter(Boolean).join('');
      if (!rows) return '';
      return `<section class="panel grp"><div class="grp-h">${ic(icon)}<h2 class="h">${esc(title)}</h2></div>${rows}</section>`;
    }

    _keysFor(list, domains = ['switch', 'select', 'number', 'time']) {
      const out = [];
      for (const k of list) for (const d of domains) { const id = this._id(d, k); if (id && !out.includes(id)) out.push(id); }
      return out;
    }

    _dockView() {
      const a = this._a;
      const lay = this._layout();
      const c = this._config;
      const ids = this._keysFor(DOCK_KEYS.filter((k) => k !== 'auto_water_refilling' || c.show_auto_water_refilling));
      const extraBtns = this._keysFor(['base_station_cleaning', 'water_tank_draining', 'base_station_self_repair'].filter((k) => k !== 'water_tank_draining' || c.show_water_tank_draining), ['button']);
      return `${this._viewHead('Dock', this._dockState())}
        <div style="display:grid;grid-template-columns:${lay === 'desktop' ? 'minmax(320px,420px) minmax(0,1fr)' : '1fr'};gap:12px;align-items:start">
          <div class="stack"><section class="panel pad">${this._dockBlock(lay === 'phone')}</section>
          ${a.drying ? `<section class="panel pad"><div class="between"><span class="h">Drying</span><span class="small muted">${num(a.drying_progress) ?? 0}%</span></div><div class="bar" style="margin-top:10px"><i style="width:${clamp(num(a.drying_progress) || 0, 0, 100)}%"></i></div></section>` : ''}
          ${this._group('Dock tools', 'mdi:toolbox-outline', extraBtns)}</div>
          <div class="cols">${this._group('Dock settings', 'mdi:home-lightning-bolt-outline', ids) || '<section class="panel pad muted">No dock settings found for this robot.</section>'}</div>
        </div>`;
    }

    _careView() {
      const parts = this._consumables();
      const notes = this._notes();
      const warn = Number(this._config.care_warning ?? 20), crit = Number(this._config.care_critical ?? 10);
      const faults = notes.filter((n) => n.id.startsWith('fault_') || n.id === 'error');
      const stat = (key, attr, label, fmt) => {
        const s = this._live('sensor', key);
        const raw = s ? s.state : this._a[attr];
        if (raw === undefined || raw === null) return '';
        return `<div class="stat"><div class="lbl">${label}</div><b>${esc(fmt ? fmt(raw, s) : raw)}</b></div>`;
      };
      const mins = (v, s) => {
        const u = s?.attributes?.unit_of_measurement || 'min';
        const n = num(v); if (n === null) return v;
        if (/^min/.test(u)) return `${Math.round(n / 60).toLocaleString()} h`;
        return `${n.toLocaleString()} ${u}`;
      };
      const stats = [
        stat('total_cleaning_time', 'total_cleaning_time', 'Total cleaning time', mins),
        stat('cleaning_count', 'cleaning_count', 'Cleanings', (v) => Number(v).toLocaleString()),
        stat('total_cleaned_area', 'total_cleaned_area', 'Total area', (v, s) => `${Math.round(Number(v)).toLocaleString()} ${s?.attributes?.unit_of_measurement || 'm²'}`),
        stat('first_cleaning_date', 'first_cleaning_date', 'First cleaning', (v) => { const d = new Date(v); return isNaN(d) ? v : d.toLocaleDateString(); }),
      ].join('');
      return `${this._viewHead('Care', 'Parts, warnings and lifetime totals')}
        <div class="stack">
          ${faults.map((n) => `<div class="alert crit" style="cursor:default">${ic(n.icon, 'style="color:var(--dv-errt)"')}<span class="grow"><b style="font-weight:500;display:block">${esc(n.title)}</b><span class="xs muted">${esc(n.desc)}</span></span>${n.action ? `<button class="btn sm" data-a="${n.action.a}" data-e="${n.action.e || ''}">${esc(n.action.label)}</button>` : ''}</div>`).join('')}
          <div class="parts">${parts.map((p) => {
            const color = p.pct <= crit ? 'var(--dv-err)' : p.pct <= warn ? 'var(--dv-warn)' : 'var(--dv-p)';
            const tcol = p.pct <= crit ? 'var(--dv-errt)' : p.pct <= warn ? 'var(--dv-warnt)' : 'var(--dv-text2)';
            return `<section class="panel pad stack" style="gap:14px"><div class="rowf" style="gap:14px">
              <div class="ring" style="background:conic-gradient(${color} ${p.pct}%, var(--dv-bg2) 0)" role="img" aria-label="${esc(p.name)} ${p.pct}%"><span>${p.pct}%</span></div>
              <div class="grow"><h2 class="h" style="font-size:15px">${esc(p.name)}</h2><div class="small" style="margin-top:4px;color:${tcol}">${p.timeLeft !== null ? `${p.timeLeft} ${esc(p.unit)} left` : ''}</div></div></div>
              <div class="between"><span class="xs muted">${ic(p.icon, 'style="--mdc-icon-size:16px;vertical-align:-3px"')}</span><button class="btn sm" data-a="reset" data-v="${p.key}" aria-label="Reset ${esc(p.name)}">Reset</button></div></section>`;
          }).join('') || '<section class="panel pad muted">No consumable data reported.</section>'}</div>
          ${stats ? `<section class="panel pad stack"><h2 class="h">Lifetime</h2><div class="stats">${stats}</div></section>` : ''}
        </div>`;
    }

    _settingsView() {
      const used = new Set();
      const groups = [];
      const all = Object.entries(this._map).filter(([k]) => !k.includes('.room_'));
      for (const [gid, title, icon, keys] of GROUPS) {
        const ids = this._keysFor(keys);
        ids.forEach((i) => used.add(i));
        groups.push(this._group(title, icon, ids));
      }
      const skip = new Set([...CLEAN_KEYS, ...DOCK_KEYS]);
      const other = all.filter(([k, id]) => {
        const [d, key] = k.split('.');
        return ['switch', 'select', 'number', 'time'].includes(d) && !used.has(id) && !skip.has(key);
      }).map(([, id]) => id);
      groups.push(this._group('Other', 'mdi:dots-horizontal', other));
      const actions = all.filter(([k]) => k.startsWith('button.') && !/^button\.(reset_|start_auto_empty$|self_clean$|manual_drying$|clear_warning$|start_washing$|pause_washing$|start_drying$|stop_drying$)/.test(k) && (k !== 'button.water_tank_draining' || this._config.show_water_tank_draining)).map(([, id]) => id);
      groups.push(this._group('Actions', 'mdi:play-box-outline', actions));
      groups.push(this._roomSettings());
      return `${this._viewHead('Settings', `${this._title()} · changes apply right away`)}<div class="cols">${groups.filter(Boolean).join('')}</div>`;
    }

    _roomSettings() {
      const rooms = this._rooms();
      if (!rooms.length) return '';
      const rid = this._ui.room ?? rooms[0].id;
      const pre = `room_${rid}_`;
      const ids = Object.entries(this._map).filter(([k]) => k.split('.')[1]?.startsWith(pre)).map(([, id]) => id);
      if (!ids.length && !Object.keys(this._map).some((k) => k.includes('.room_'))) return '';
      const rows = ids.map((id) => this._control(id, human(id.split('.')[1].split(pre)[1] || ''))).join('');
      return `<section class="panel grp"><div class="grp-h">${ic('mdi:floor-plan')}<h2 class="h grow">Rooms</h2>
        <select class="sel" data-a="setroom" aria-label="Room">${rooms.map((r) => `<option value="${r.id}" ${r.id === rid ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div>
        ${rows || '<div class="row small muted">No per-room settings for this room.</div>'}</section>`;
    }

    _historyItems() {
      const pics = this._cam?.attributes?.cleaning_history_picture || {};
      return Object.entries(pics).map(([k, url]) => {
        const m = k.match(/^\s*(\d+):\s*(.+?)\s+-\s+(.+?)(?:\s*\((.+)\))?$/);
        return m ? { idx: Number(m[1]), when: m[2], title: m[3], status: m[4] || '', url } : { idx: 0, when: '', title: k, status: '', url };
      });
    }

    _historyView() {
      const items = this._historyItems();
      const sel = items[this._ui.hist] || items[0];
      const obs = Object.entries(this._cam?.attributes?.obstacle_picture || {});
      const url = (u) => (this._hass.hassUrl ? this._hass.hassUrl(u) : u);
      if (!items.length) return `${this._viewHead('History')}<section class="panel pad muted">No cleaning history reported yet.</section>`;
      const list = items.map((it, i) => {
        const on = it === sel;
        const ok = /complete/i.test(it.status);
        return `<button class="hitem ${on ? 'on' : ''}" aria-pressed="${on}" data-a="hist" data-v="${i}">
          <span style="width:36px;height:36px;border-radius:50%;background:var(--dv-bg2);display:grid;place-items:center;flex-shrink:0;color:${ok ? 'var(--dv-pt)' : 'var(--dv-warnt)'}">${ic(/zone/i.test(it.title) ? 'mdi:selection-drag' : 'mdi:robot-vacuum')}</span>
          <span class="grow"><span style="display:block;font-size:14px;font-weight:500">${esc(it.title)}</span><span class="xs muted">${esc(it.when)}</span></span>
          <span class="xs" style="color:${ok ? 'var(--dv-text2)' : 'var(--dv-warnt)'}">${esc(it.status)}</span></button>`;
      }).join('');
      return `${this._viewHead('History', `${items.length} recent runs`)}
        <div class="hist"><section class="panel hlist">${list}</section>
          <section class="panel pad stack" style="min-height:0">
            <div class="between"><div><h2 class="h">${esc(sel.title)}</h2><div class="small muted">${esc(sel.when)}</div></div><span class="small" style="color:${/complete/i.test(sel.status) ? 'var(--dv-ok)' : 'var(--dv-warnt)'}">${esc(sel.status)}</span></div>
            <div class="himg" style="flex:1 1 auto"><img src="${esc(url(sel.url))}" alt="Map of the ${esc(sel.title)} run" loading="lazy"></div>
            ${obs.length ? `<div class="stack-s"><span class="lbl">Obstacle photos</span><div class="obs">${obs.slice(0, 8).map(([k, u]) => `<figure><img src="${esc(url(u))}" alt="${esc(k)}" loading="lazy"><figcaption class="muted">${esc(k.replace(/^\d+:\s*/, '').replace(/%(\d+)/, '$1%'))}</figcaption></figure>`).join('')}</div></div>` : ''}
          </section></div>`;
    }

    _remoteView() {
      const sp = this._ui.speed;
      return `<div class="stack" style="gap:18px">
        <div><h1 class="h-xl">Remote control</h1><div class="small muted" style="margin-top:4px">Press and hold to drive. Obstacle sensors stay on.</div></div>
        <div class="dpad" role="group" aria-label="Direction pad">
          <button style="top:10px;left:calc(50% - var(--b) / 2)" data-hold="fwd" aria-label="Forward">${ic('mdi:arrow-up-bold')}</button>
          <button style="bottom:10px;left:calc(50% - var(--b) / 2)" data-hold="back" aria-label="Backward">${ic('mdi:arrow-down-bold')}</button>
          <button style="top:calc(50% - var(--b) / 2);left:10px" data-hold="left" aria-label="Turn left">${ic('mdi:rotate-left')}</button>
          <button style="top:calc(50% - var(--b) / 2);right:10px" data-hold="right" aria-label="Turn right">${ic('mdi:rotate-right')}</button>
          <button class="c" style="top:calc(50% - var(--b) / 2);left:calc(50% - var(--b) / 2)" data-a="svc" data-v="stop" aria-label="Stop">${ic('mdi:stop')}</button>
        </div>
        <div class="stack-s"><span class="lbl">Speed</span><div class="seg" role="group" aria-label="Speed">${[['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']].map(([id, l]) => `<button class="${sp === id ? 'on' : ''}" aria-pressed="${sp === id}" data-a="speed" data-v="${id}">${l}</button>`).join('')}</div></div>
        <div class="rowf"><button class="btn" style="flex:1" data-a="svc" data-v="return_to_base">${ic('mdi:home-import-outline')}Send to dock</button></div>
      </div>`;
    }

    /* ---------- events ---------- */
    _onClick(ev) {
      const el = ev.target.closest('[data-a]');
      if (!el || el.disabled) return;
      const a = el.dataset.a;
      const v = el.dataset.v;
      const e = el.dataset.e;
      const u = this._ui;
      if (['optsel', 'num', 'time', 'setroom'].includes(a)) return; // handled on change
      switch (a) {
        case 'view': u.view = v; u.pop = null; break;
        case 'target': u.target = v; break;
        case 'room': {
          const id = Number(v);
          u.sel = u.sel.includes(id) ? u.sel.filter((x) => x !== id) : [...u.sel, id];
          break;
        }
        case 'passes': u.passes = Number(v); break;
        case 'clearsel': u.zone = null; u.spot = null; break;
        case 'sheettab': u.sheetTab = v; break;
        case 'sheet': u.sheetOpen = !u.sheetOpen; break;
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

    _move(rotation, velocity) {
      return this._call('dreame_vacuum', 'vacuum_remote_control_move_step', { entity_id: this._config.entity, rotation, velocity }, true);
    }

    _startHold(btn) {
      this._stopHold();
      const dir = btn.dataset.hold;
      const vel = { slow: 100, normal: 200, fast: 300 }[this._ui.speed] || 200;
      // rotation is an angular speed (spdw), so turns scale with the speed setting and stay gentle
      const rot = { slow: 20, normal: 32, fast: 48 }[this._ui.speed] || 32;
      const cmd = { fwd: [0, vel], back: [0, -vel], left: [rot, 0], right: [-rot, 0] }[dir];
      if (!cmd) return;
      btn.classList.add('held');
      const hold = { btn, dead: false, t: null };
      this._hold = hold;
      // Wait for each step to finish before sending the next. Firing on a fixed timer queues
      // commands faster than the robot runs them, so it keeps rolling after release.
      const tick = async () => {
        if (hold.dead) return;
        await this._move(cmd[0], cmd[1]);
        if (!hold.dead) hold.t = setTimeout(tick, 100);
      };
      tick();
    }

    _stopHold() {
      const hold = this._hold;
      if (!hold) return;
      hold.dead = true;
      clearTimeout(hold.t);
      hold.btn.classList.remove('held');
      this._hold = null;
      this._move(0, 0); // explicit stop step
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
        // The robot accepts vacuum_clean_spot but aborts and returns to the dock (seen on Beep-0,
        // firmware 1639), so spot cleaning is sent as a small zone clean (about 1.2 m square, the
        // same ~1.5 m2 patch a native spot cleans), which this robot runs reliably.
        const half = 600;
        const zone = [u.spot[0] - half, u.spot[1] - half, u.spot[0] + half, u.spot[1] + half];
        return this._call('dreame_vacuum', 'vacuum_clean_zone', { entity_id: ent, zone: [zone], repeats: u.passes });
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
