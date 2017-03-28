function TotalsTimeline (params) {
  var self = this

  // Immutable
  self._texts = params.texts
  self._props = {
    id: params.id,
    margin: params.margin,
  }
  self._elem = {}
  self._helpers = {}
  self._schema = params.schema

  // Mutable
  self._state = {
    contentArea: {
      width: params.width,
      height: params.height
    },
    dataArea: {
      width: params.width - self._props.margin.left - self._props.margin.right,
      height: params.height - self._props.margin.top - self._props.margin.bottom
    },
    dateRange: [moment.utc().subtract(1, 'years'), moment.utc()],
    organization: '',
    category: '',
    locale: params.locale,
  }

  self._data = {}

  self._renderBase(params.element)
  self.resize(params.width, params.height)
}


// Update all: language, data visuals, input elements, etc.
TotalsTimeline.prototype.setData = function (data, organizations = undefined) {
  var self = this
  self._data.raw = data
  self._data.organizations = organizations
  self._data.line = self._transformLineData(data)
  self._helpers.xScale.domain(self._getXExtent())
  self._helpers.yScale.domain(self._getYExtent())

  self._renderLine()
  self._renderFocusPoint()
  self._resizeAxis('y')
}


// Limit the view to these dates (doesn't change the data given to this element)
TotalsTimeline.prototype.setDateFilter = function (dates) {
  var self = this
  self._state.dateRange = dates
  self._resizeAxis('x')
  self._resizeAxis('y')
}


TotalsTimeline.prototype.setOrganizationFilter = function (organization) {
  var self = this
  self._state.organization = organization
  self._data.line = self._transformLineData(self._data.raw)
  self._renderLine()
  self._resizeAxis('y')
}


TotalsTimeline.prototype.setCategoryFilter = function (category) {
  var self = this
  self._state.category = category
  self._data.line = self._transformLineData(self._data.raw)
  self._renderLine()
  self._resizeAxis('y')
}


// Resize the visualization to a new pixel size on the screen
TotalsTimeline.prototype.resize = function (contentWidth, contentHeight = undefined) {
  var self = this

  self._state.contentArea.width = contentWidth
  if (typeof contentHeight !== 'undefined') {
    self._state.contentArea.height = contentHeight
  }
  self._elem.svg
    .attr('width', self._state.contentArea.width)
    .attr('height', self._state.contentArea.height)

  self._state.dataArea = {
    width: self._state.contentArea.width - self._props.margin.left - self._props.margin.right,
    height: self._state.contentArea.height - self._props.margin.top - self._props.margin.bottom,
  }

  self._elem.dataCanvas
    .attr('width', self._state.dataArea.width)
    .attr('height', self._state.dataArea.height)

  self._elem.dataClipper
    .attr('width', self._state.dataArea.width + 2)
    .attr('height', self._state.dataArea.height + 1)

  self._elem.mouseEvents
    .attr('width', self._state.dataArea.width)
    .attr('height', self._state.dataArea.height + 25)

  // Update pixel ranges for x and y dimension
  self._helpers.xScale.rangeRound([0, self._state.dataArea.width])
  self._helpers.yScale.rangeRound([self._state.dataArea.height, 0])

  self._resizeAxis('x')
  self._resizeAxis('y')
}


// Turns a list of items with publishing dates (datasets, apps, etc.) into a list of dates with cumulative number of published items on each date
// Used when new data is loaded and when a filter is changed (organization or category)
TotalsTimeline.prototype._transformLineData = function (data) {
  var self = this
  var result = {}

  // First, create an empty data table with the correct datespan
  var dateToAdd = moment.utc(self._state.dateRange[0])
  while (dateToAdd.isSameOrBefore(self._state.dateRange[1])) {
    var dateString = moment.utc(dateToAdd).format('YYYY-MM-DD')
    result[dateString] = {
      date: dateToAdd.toDate(),
      added: [],
      removed: [],
      value: undefined,
    }
    dateToAdd.add(1, 'days')
  }

  function findSelectedOrganizations (branch, isChildOfSelected = false) {
    var result = []

    // Each org in this branch
    for (i in branch) {
      // This is the selected?
      var organization = branch[i]

      if (isChildOfSelected || self._state.organization === organization.id) {
        result.push(organization.id)
        result = result.concat(findSelectedOrganizations(organization.children, true))
      } else {
        result = result.concat(findSelectedOrganizations(organization.children, false))
      }
    }
    return result
  }

  var selectedOrganizations = undefined
  if (self._state.organization !== '') {
    selectedOrganizations = findSelectedOrganizations(self._data.organizations)
  }

  // Add each item to its creation date
  data.forEach(function(item) {
    var itemDate = moment.utc(item[self._schema.dateField]).format('YYYY-MM-DD')

    if (
      // Skip item for customized reason?
      self._schema.skip(item) ||

      // Date before datespan?
      itemDate < self._state.dateRange[0].format('YYYY-MM-DD') ||

      // Date after datespan?
      itemDate > self._state.dateRange[1].format('YYYY-MM-DD') ||

      // Organization filtered out?
      (self._state.organization !== '' &&
      selectedOrganizations.indexOf(item.organization.id) === -1) ||

      // Category filtered out?
      (self._state.category !== '' && !item.groups.find(function (group) {
        return group.id === self._state.category
      }))
    ) {
      return true
    }

    // Add creation of this item
    var itemName = item[self._schema.nameField]
    if (typeof(itemName) === 'object') {
      itemName = itemName[self._state.locale]
    }
    result[itemDate].added.push(itemName)
  })

  // TODO: Get data from removed items
  //   result[item.date_modified].removed.push(item.title_translated[config.locale])

  // Calculate cumulative values
  dateToCumulate = moment.utc(self._state.dateRange[0])
  cumulativeValue = 0
  while (dateToCumulate.isSameOrBefore(self._state.dateRange[1])) {
    dateString = dateToCumulate.format('YYYY-MM-DD')
    cumulativeValue = cumulativeValue + result[dateString].added.length - result[dateString].removed.length
    result[dateString].value = cumulativeValue
    dateToCumulate.add(1, 'days')
  }

  // Turn into array
  var resultArray = []
  for (i in result) {
    resultArray.push(result[i])
  }
  return resultArray
}


// Add HTML and SVG elements that can be drawn without data and just altered on data updates and window resizes
TotalsTimeline.prototype._renderBase = function (container) {
  var self = this

  self._elem.container = container
  self._elem.container.classed('statistics-vis totals-timeline', true)

  // Add HTML elements
  self._elem.title = self._elem.container.append('h3')
    .classed('statistics-vis-title', true)
    .text(self._texts.title)

  // For SVG items
  self._elem.svg = self._elem.container.append('svg')
  self._elem.svgCanvas = self._elem.svg.append('g')
    .attr('transform', 'translate(' + self._props.margin.left + ',' + self._props.margin.top + ')')

  // Behind data items: ticks
  self._elem.backLayer = self._elem.svgCanvas.append('g')

  self._elem.dataCanvas = self._elem.svgCanvas.append('g')

  // Cuts out the data elements outside the axes
  self._elem.dataClipper = self._elem.svgCanvas
    .append('clipPath')
      .attr('transform', 'translate(-1, -1)')
      .attr('id', 'js-statistics-totals-timeline-data-clipper-' + self._props.id)
    .append('rect')

  self._elem.dataCanvas.attr('clip-path', 'url(#js-statistics-totals-timeline-data-clipper-' + self._props.id + ')')

  // Graphs, cropped by data area
  self._elem.lineCanvas = self._elem.dataCanvas.append('g')

  // Axes, legends, titles etc. in front of data items
  self._elem.frontLayer = self._elem.svgCanvas.append('g')

  // Axis scales
  self._helpers.xScale = d3.scaleTime()
  self._helpers.yScale = d3.scaleLinear()

  // Function to get a dot in a line plot
  self._helpers.lineDrawer = d3.line()
    .x(function(d) { return self._helpers.xScale(d.date) })
    .y(function(d) { return self._helpers.yScale(d.value) })

  self._elem.line = self._elem.lineCanvas.append('path')
    .classed('statistics-line statistics-totals-timeline-line', true)

  // Focus point on the graph, changed by mouseover
  self._elem.focusPoint = self._elem.frontLayer.append('g')
    .classed('statistics-focus-point', true)
  self._elem.focusPoint.append('circle')
    .attr('r', 4.5)
  self._elem.focusPoint.append('line')
  self._elem.focusPoint.append('text')
    .classed('js-statistics-count statistics-count', true)
    .attr('x', -80)
    .attr('dy', '-30px')
  self._elem.focusPoint.append('text')
    .classed('js-statistics-date statistics-date', true)
    .attr('x', -80)
    .attr('dy', '-12px')
  var bisectDate = d3.bisector(function(d) { return d.date }).left
  self._elem.mouseEvents = self._elem.svgCanvas.append('rect')
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mouseout', function () {
      return self._renderFocusPoint()
    })
    .on('mousemove', function () {
      var x0 = self._helpers.xScale.invert(d3.mouse(this)[0])
      if (!self._data.line) {
        return
      }
      var i = bisectDate(self._data.line, x0, 1)
      var d0 = self._data.line[i - 1]
      var d1 = self._data.line[i]
      if (!d1) {
        return
      }
      var d = x0 - d0.date > d1.date - x0 ? d1 : d0
      self._renderFocusPoint(d)
    })

  // X axis
  self._helpers.xAxisGenerator = d3.axisBottom(self._helpers.xScale)
  self._elem.xAxis = self._elem.frontLayer.append('g')
    .classed('statistics-axis', true)
    .attr('transform', 'translate(0,' + self._state.dataArea.height + ')')
    .call(self._helpers.xAxisGenerator)

  // Y axis
  self._updateYAxisGenerator()
  self._elem.yAxis = self._elem.backLayer.append('g')
    .classed('statistics-axis statistics-axis-y', true)
    .call(self._helpers.yAxisGenerator)
}


// Set new data for the line plot
TotalsTimeline.prototype._renderLine = function () {
  var self = this
  self._elem.line
    .datum(self._data.line)
    .attr('d', self._helpers.lineDrawer)
}


// Renders highlight and details on the given date d. If no d is given, d is the last visible date
TotalsTimeline.prototype._renderFocusPoint = function (d) {
  var self = this

  // Choose last date if no date is given as parameter
  if (!d) {
    if (!self._data.line || self._data.line.length <= 0) {
      return
    }
    if (!self._state.dateRange[1]) {
      d = self._data.line[self._data.line.length - 1]
    } else {
      var bisector =
      d = self._data.line[
        d3.bisector(function (point) {
          return point.date
        }).left(self._data.line, self._state.dateRange[1].toDate())
      ]
      if (!d) {
        d = self._data.line[self._data.line.length - 1]
      }
    }
  }

  // Draw the point
  self._elem.focusPoint.attr('transform', 'translate(' + self._helpers.xScale(d.date) + ', ' +  self._helpers.yScale(d.value) + ')')
  self._elem.focusPoint.select('line')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', -self._helpers.yScale(d.value))
    .attr('y2', -self._helpers.yScale(d.value) + self._state.dataArea.height)
  self._elem.focusPoint.select('.js-statistics-count').html(d.value)
  self._elem.focusPoint.select('.js-statistics-date').html(moment.utc(d.date).format('D.M.YYYY'))
}


// Animate new size of y or x axis based on new date filter or organization/category filter
TotalsTimeline.prototype._resizeAxis = function (axis) {
  var self = this
  if (!self._data.line) {
    return
  }
  var currentExtent
  var newExtent
  if (axis === 'x') {
    currentExtent = self._helpers.xScale.domain()
    newExtent = self._getXExtent()
  } else {
    currentExtent = self._helpers.yScale.domain()
    newExtent = self._getYExtent()

    // Update ticks for y axis
    self._updateYAxisGenerator()
    self._elem.yAxis.call(self._helpers.yAxisGenerator)
  }

  clearTimeout(self._state['resizeAxisTimeout' + axis])
  self._state['resizeAxisTimeout' + axis] = setTimeout(function () {

    // Init transition for each selected item (= only one axis)
    self._elem[axis + 'Axis'].transition().duration(800)
    .tween('resizeAxisTween', function (d, i) {
      // self._elem.yAxis.select('.domain').remove()
      var axisScaleInterpolator = d3.interpolate(currentExtent, newExtent)
      // What to do on each animation frame
      return function (t) {
        // Update scale
        self._helpers[axis + 'Scale'].domain(axisScaleInterpolator(t))

        // Redraw axis with new scale
        self._elem[axis + 'Axis'].call(self._helpers[axis + 'AxisGenerator'])
        // Redraw the line with new scale
        self._elem.line.attr('d', self._helpers.lineDrawer)

        // Redraw point with new scale
        self._renderFocusPoint()
      }
    })
  }, 100)
}

TotalsTimeline.prototype._updateYAxisGenerator = function () {
  var self = this
  self._helpers.yAxisGenerator = function (g) {
    g.call(d3.axisRight(self._helpers.yScale)
      .tickSize(self._state.dataArea.width)
      .tickValues(d3.range(self._helpers.yScale.domain().slice(-1)[0] + 1))
      .tickFormat(function(d) {
        return this.parentNode.nextSibling
            ? '\xa0' + d
            : d + ' ' + self._texts.amount;
      })
    )

    // Remove vertical line
    g.select('.domain').remove()

    // Move texts to the right side of the graph
    g.selectAll(".tick text")
      .attr("x", self._state.dataArea.width + 2)
      .attr("dy", 2)
  }
}


// Calculate proper data range for the x axis based on current data
TotalsTimeline.prototype._getXExtent = function () {
  var self = this
  return [
    self._state.dateRange[0].toDate(),
    self._state.dateRange[1].toDate(),
  ]
}


// Calculate proper data range for the y axis based on current data
TotalsTimeline.prototype._getYExtent = function () {
  var self = this
  return [
    // Y min = 0 or lower
    Math.min(0, Math.round(d3.min(self._data.line, function(d) { return d.value }) * 1.25 + 1)),
    // Y max = max value + some margin
    Math.round(d3.max(self._data.line, function(d) { return d.value }) * 1.25 + 1)
  ]
}
