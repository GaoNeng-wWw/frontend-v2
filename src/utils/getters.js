import store from '@/store'
import existUtils from '@/utils/existUtils'
import formatter from '@/utils/timeFormatter'
// import Console from "@/utils/Console";

const Getters = {}

Getters.items = {
  _cache: null,
  validItemTypes: ['MATERIAL', 'CARD_EXP', 'CHIP', 'FURN', 'ACTIVITY_ITEM'],
  all (map = false, filter = true) {
    let items = store.getters['data/content']({ id: 'items' })
    if (!items) return []

    if (filter) {
      items = items.filter(item => {
        return item.existence[store.getters['dataSource/server']].exist
      })
    }

    if (map) {
      if (!this._cache) this._cache = new Map(items.map(item => [item.itemId, item]))
      return this._cache
    } else {
      return items
    }
  },
  byItemId (itemId, ...options) {
    const got = this.all(...options)
    if (!got) return {}
    return got.find(el => el.itemId === itemId) || {}
  },
  byName (name, ...options) {
    const got = this.all(...options)
    if (!got) return {}
    return got.find(el => el.name === name) || {}
  },
  byGroupId (groupId, ...options) {
    if (!groupId) return []
    const got = this.all(...options)
    if (!got) return []
    return got.filter(el => el.groupID === groupId) || []
  }
}

// Getters.limitations = {
//   byStageId(stageId) {
//     return store.getters["data/content"]({id: "stages"}).find(el => {
//       return el.name === stageId
//     })
//   }
// }

Getters.statistics = {
  base (filter) {
    const matrix = store.getters['data/content']({ id: `${store.getters['dataSource/source']}Matrix` })
    if (!matrix) return null
    return matrix
      .filter(filter)
      .map(el => {
        const stage = Getters.stages.byStageId(el.stageId)
        const percentage = +(el.quantity / el.times).toFixed(5)
        return {
          ...el,
          stage,
          percentage,
          percentageText: `${(percentage * 100).toFixed(2)}%`,
          apPPR: (stage.apCost / percentage).toFixed(2),
          itemPerTime: (stage.minClearTime / percentage).toFixed(2)
        }
      })
  },
  byItemId (itemId) {
    const matrix = this.base(el => {
      return el.itemId === itemId
    })
    if (!matrix) return []

    return matrix.map(el => {
      return {
        ...el,
        zone: Getters.zones.byZoneId(el.stage.zoneId, false)
      }
    })
  },
  byStageId (stageId) {
    const matrix = this.base(el => {
      return el.stageId === stageId
    })
    if (!matrix) return []

    return matrix.map(el => {
      return {
        ...el,
        item: Getters.items.byItemId(el.itemId)
      }
    })
  }
}

Getters.patterns = {
  base (filter) {
    const matrix = store.getters['data/content']({ id: `${store.getters['dataSource/source']}PatternMatrix` })
    if (!matrix) return null
    return matrix
      .filter(filter)
      .map(el => {
        const stage = Getters.stages.byStageId(el.stageId)
        const percentage = +(el.quantity / el.times).toFixed(5)
        return {
          ...el,
          stage,
          percentage,
          percentageText: `${(percentage * 100).toFixed(2)}%`
        }
      })
  },
  byStageId (stageId) {
    const matrix = this.base(el => {
      return el.stageId === stageId
    })
    if (!matrix) return []

    return matrix
  }
}

Getters.stages = {
  _cache: {
    at: null,
    c: null
  },
  all () {
    const currStateTime = store.getters['data/updated']({ id: 'stages' })
    if (this._cache) {
      if (this._cache.at === currStateTime) return this._cache.c || []
    }
    const stages = store.getters['data/content']({ id: 'stages' })
    this._cache = {
      at: currStateTime,
      c: stages
    }
    if (!stages) return []
    return stages
  },
  byStageId (stageId, options) {
    return this.all(options).find(el => {
      return el.stageId === stageId
    }) || {}
  },
  byParentZoneId (zoneId, options) {
    return this.all(options).filter(el => {
      return el.zoneId === zoneId
    }) || {}
  },
  byStageCode (StageCode, options) {
    return this.all(options).find(el => {
      return el.code === StageCode
    }) || {}
  }
}

Getters.zones = {
  all (filter = true, parseTime = true) {
    let zones = store.getters['data/content']({ id: 'zones' })
    if (!zones) return []

    const server = store.getters['dataSource/server']

    if (filter) {
      zones = zones.filter(el => existUtils.existence(el, parseTime))
    }

    zones = zones.slice()
      .sort((a, b) => {
        return a.zoneIndex - b.zoneIndex
      })
      .map(el => {
        const toMerge = {}
        if (el.isActivity) {
          const existence = el.existence[server]

          if (!existence.openTime && !existence.closeTime) {
            toMerge.isPermanentOpen = true
          } else {
            toMerge.activityActiveTime = formatter.dates([existence.openTime, existence.closeTime])
            toMerge.activityStartDate = formatter.date(existence.openTime, true)
            toMerge.timeValid = formatter.checkTimeValid(existence.openTime, existence.closeTime)
            toMerge.isOutdated = toMerge.timeValid !== 0
          }
        }
        return {
          ...el,
          ...toMerge
        }
      }
    )

    return zones
  },
  byZoneId (zoneId, ...options) {
    return this.all(...options).find(el => {
      return el.zoneId === zoneId
    }) || {}
  },
  byType (type, ...options) {
    return this.all(...options).filter(el => {
      return el.type === type
    }) || {}
  }
}

Getters.trends = {
  byItemId (itemId) {
    const temp = {}
    const trends = this.all()
    if (trends) {
      Object.keys(trends).map(key => {
        // if stage contains item
        if (
          trends[key] &&
          trends[key].results &&
          trends[key].results[itemId]
        ) {
          // create an obj in temp, keyed with stageId
          temp[key] = {}
          // only include the current item data in the object
          temp[key].results = trends[key].results[itemId]
          // copy all other values
          temp[key].startTime = trends[key].startTime
        }
      })
    }
    return temp
  },
  byStageId (stageId) {
    // data has been already keyed with stageId. Just get it ;)
    return this.all() && this.all()[stageId]
  },
  all () {
    // when data source is not global, it is unable to get the trend
    // (trend of personalMatrix is not supported)
    if (store.getters['dataSource/source'] !== 'global') {
      return {}
    }
    // otherwise just return it
    return store.getters['data/content']({ id: 'trends' }) || {}
  }
}

Getters.period = {
  all(server) {
    const period = store.getters["data/content"]({ id: "period" });
    if (!period) return [];
    return period.filter((el) => existUtils.existence(el, false, server));
  },
};

Getters.config = {
  all () {
    const config = store.getters["data/content"]({ id: "config" });
    if (!config) return {};
    return config;
  },

};

Getters.siteStats = {
  all () {
    return store.getters['data/content']({ id: 'stats' })
  },
  byKey (key) {
    return this.all()[key].map(el => Object.assign({}, el)).map(el => {
      el.stage = Getters.stages.byStageId(el.stageId)
      el.zone = Getters.zones.byZoneId(el.stage.zoneId, false)
      return el
    })
  }
}

export default Getters
