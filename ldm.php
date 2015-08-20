<?php
use Symfony\Component\Console\Application;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\DomCrawler\Crawler;

require 'vendor/autoload.php';

$console = new Application();

$console
    ->register('download')
    ->setDefinition([])
    ->setDescription('Download all fro ldm')
    ->setCode(function (InputInterface $input, OutputInterface $output) {
        $url = 'http://dl.radiojv.com/feeds/podcast_lddm.xml';
        $dir = 'storage';
        $html = false;
        $errorMsg = null;
        $mp3 = [];

        if(! is_dir($dir)) {
          mkdir($dir);
        }

        $output->writeln(sprintf('Download podcast'));

        $client = new GuzzleHttp\Client();

        try {
          $response = $client->get($url);
          $html = (string)$response->getBody();
        } catch( Exception $e ) {
          $html = false;
          $errorMsg = $e->getMessage();
        }

        if( $html === false ) {
          $output->writeln(sprintf('<error>Error : %s</error>', $errorMsg));
        } else {

          $crawler = new Crawler();
          $crawler->addContent($html);

          file_put_contents('log.html', $html);

          $fichiers = $crawler->filterXpath("//channel/item/enclosure");

          if( $fichiers->count() ) {
            foreach( $fichiers->extract('url') as $fichier ) {

              $fileinfo = pathinfo($fichier);

              if( file_exists($dir.'/'.$fileinfo['basename'])) {
                continue;
              }

              $mp3[] = $fichier;

            }
          }


          if( $mp3 ) {

            foreach($mp3 as $m) {
              $i = pathinfo($m);
              $filename = $i['basename'];
              $progress = new ProgressBar($output, 100);
              $progress->setFormat(' %filename% %current%/%max% [%bar%] %percent:3s%% %elapsed:6s%/%estimated:-6s%');
              $progress->setMessage($filename, 'filename');
              $progress->start();
              Download::go( $m, $dir.'/'.$filename, function( $p ) use($progress){
                  $progress->advance();
              });
              $progress->finish();
              //$progress->clear();
            }
          }

        }


    });

$console->run();


class Download {

  static $previousProgress = 0;

  public static function go($url, $destination, $callback) {

    $targetFile = fopen( $destination, 'w' );
    $ch = curl_init( $url );
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt( $ch, CURLOPT_NOPROGRESS, false );
    curl_setopt( $ch, CURLOPT_PROGRESSFUNCTION, function($r, $download_size, $downloaded_size, $upload_size, $uploaded_siz) use($callback) {

      if ( $download_size == 0 ) {
          $progress = 0;
      } else {
          $progress = round( $downloaded_size * 100 / $download_size );
      }

      if ( $progress > static::$previousProgress)
      {
          static::$previousProgress = $progress;
          $callback($progress);
      }
    } );
    curl_setopt( $ch, CURLOPT_FILE, $targetFile );
    curl_exec( $ch );
    fclose( $targetFile );

  }

}
?>
