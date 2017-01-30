<?php
/**
* Hero -partial
*/
?>

<div class="hero">
  <div class="container">
    <div class="row">
      <h1 class="heading text-center">6Aika Open Data Portal</h1>
      <h3 class="subheading text-center">Avointa dataa vapaasti hyödynnettäväksesi</h3>  

      <div class="col-md-8 col-md-offset-2">
        <div class="input-group">
          <div class="input-group-btn">
            <button type="button" class="btn btn-default btn-lg dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span id="selected-domain" data-value="/data/dataset">Tietoaineistot</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu dropdown-menu-right">
              <li><a data-value="/data/dataset">Tietoaineistot</a></li>
              <li><a data-value="/data/showcase">Sovellukset</a></li>
              <li><a data-value="/data/collection">Aineistokokonaisuudet</a></li>
              <li><a data-value="/posts">Artikkelit</a></li>
              <li role="separator" class="divider"></li>
              <li><a>Muut</a></li>
            </ul>
          </div><!-- /btn-group -->
          <input type="text" id="q" class="form-control input-lg" aria-label="...">
          <span class="input-group-btn">
            <button id="search" class="btn btn-lg btn-default" type="button">Hae</button>
          </span>
        </div><!-- /input-group -->    
      </div>

    </div>
  </div>
  <?php include(locate_template('/partials/featured-stats.php')); ?>
</div>
